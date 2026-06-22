import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,

  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../shared/services/firebase';
import type { TrocasData, Setor } from '../../../shared/types/trocas';
import { getDepartamentosAtivos } from '../../departamentos/services/departamentoService';
import { convertFirestoreTimestamp } from '../../../shared/utils/auth';
import { logger } from '../../../shared/utils/logger';
import { calculateSetorStats } from '../../../shared/utils/setores';

const calculateTotals = (setores: Setor[]): { total_realizado: number; total_meta: number; total_diferenca: number } => {
  const total_realizado = setores.reduce((sum, s) => sum + s.realizado, 0);
  const total_meta = setores.reduce((sum, s) => sum + s.meta, 0);
  const total_diferenca = total_realizado - total_meta;
  return { total_realizado, total_meta, total_diferenca };
};

const TROCAS_COLLECTION = 'historico';

const sanitizeSetoresForFirestore = (setores: Setor[]): Record<string, unknown>[] => {
  return setores.map((s) => {
    const clean: Record<string, unknown> = {
      id: s.id,
      categoria: s.categoria,
      realizado: s.realizado,
      meta: s.meta,
      diferenca: s.diferenca,
      percentual: s.percentual,
      status: s.status,
    };
    if (s.criado_em != null) clean.criado_em = s.criado_em;
    if (s.atualizado_em != null) clean.atualizado_em = s.atualizado_em;
    return clean;
  });
};

const docToTrocasData = (docSnap: { exists(): boolean; id: string; data(): Record<string, unknown> }): TrocasData | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  const setoresRaw = data.setores as Array<Record<string, unknown>>;
  return {
    id: docSnap.id,
    data: data.data as string,
    setores: (setoresRaw || []).map(calculateSetorStats),
    total_realizado: data.total_realizado as number,
    total_meta: data.total_meta as number,
    total_diferenca: data.total_diferenca as number,
    usuario_id: data.usuario_id as string,
    criado_em: convertFirestoreTimestamp(data.criado_em),
    atualizado_em: convertFirestoreTimestamp(data.atualizado_em),
  };
};

export const getTrocasByDate = async (
  date: string,
  userId: string
): Promise<TrocasData | null> => {
  try {
    logger.debug('trocasService', `Buscando trocas para ${date}`, { userId });

    const trocasRef = collection(db, TROCAS_COLLECTION);
    const q = query(
      trocasRef,
      where('data', '==', date),
      where('usuario_id', '==', userId),
      firestoreLimit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      logger.debug('trocasService', 'Nenhuma troca encontrada para esta data');
      return null;
    }

    logger.debug('trocasService', 'Troca encontrada', { docId: querySnapshot.docs[0].id });
    return docToTrocasData(querySnapshot.docs[0]);
  } catch (error) {
    logger.error('trocasService', 'Erro ao buscar trocas por data', error);
    throw error;
  }
};

export const createTrocas = async (
  date: string,
  userId: string,
  setores?: Setor[]
): Promise<TrocasData | null> => {
  try {
    logger.info('trocasService', `Criando trocas para ${date}`, { userId });

    let newSetores: Setor[];

    if (setores && setores.length > 0) {
      newSetores = setores.map((s) => calculateSetorStats(s));
    } else {
      const departamentos = await getDepartamentosAtivos();

      if (departamentos.length === 0) {
        logger.warn('trocasService', 'Nenhum departamento ativo encontrado');
        return null;
      }

      logger.info('trocasService', `${departamentos.length} departamentos encontrados`, {
        departamentos: departamentos.map((d) => d.nome),
      });

      const setoresBase = departamentos.map((d) => ({
        categoria: d.nome,
        realizado: 0,
        meta: d.meta_mensal,
      }));

      newSetores = setoresBase.map((s) => calculateSetorStats(s));
    }

    const totals = calculateTotals(newSetores);

    const docId = `${userId}_${date}`;
    const docRef = doc(db, TROCAS_COLLECTION, docId);
    const trocasData = {
      data: date,
      setores: sanitizeSetoresForFirestore(newSetores),
      ...totals,
      usuario_id: userId,
      criado_em: serverTimestamp(),
      atualizado_em: serverTimestamp(),
    };

    await setDoc(docRef, trocasData);

    return {
      id: docRef.id,
      data: date,
      setores: newSetores,
      ...totals,
      usuario_id: userId,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('trocasService', 'Erro ao criar trocas', error);
    throw error;
  }
};

export const updateTrocas = async (
  trocasId: string,
  setores: Setor[],
  usuarioId: string
): Promise<TrocasData | null> => {
  try {
    logger.info('trocasService', `Atualizando trocas: ${trocasId}`, { usuarioId });
    const setoresWithStats = setores.map(calculateSetorStats);
    const totals = calculateTotals(setoresWithStats);

    const docRef = doc(db, TROCAS_COLLECTION, trocasId);
    await updateDoc(docRef, {
      setores: sanitizeSetoresForFirestore(setoresWithStats),
      ...totals,
      usuario_id: usuarioId,
      atualizado_em: serverTimestamp(),
    });

    const updatedSnap = await getDoc(docRef);
    logger.info('trocasService', 'Trocas atualizadas com sucesso');
    return docToTrocasData(updatedSnap);
  } catch (error) {
    logger.error('trocasService', 'Erro ao atualizar trocas', error);
    throw error;
  }
};

export const resetTrocas = async (
  trocasId: string,
  userId: string
): Promise<TrocasData | null> => {
  try {
    logger.info('trocasService', `Resetando trocas: ${trocasId}`, { userId });
    const docRef = doc(db, TROCAS_COLLECTION, trocasId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const currentData = docToTrocasData(docSnap);

    if (!currentData) {
      return null;
    }

    const resetSetores = currentData.setores.map((s) =>
      calculateSetorStats({
        ...s,
        realizado: 0,
      })
    );

    const total_realizado = 0;
    const total_meta = currentData.total_meta;
    const total_diferenca = -total_meta;

    await updateDoc(docRef, {
      setores: sanitizeSetoresForFirestore(resetSetores),
      total_realizado,
      total_meta,
      total_diferenca,
      usuario_id: userId,
      atualizado_em: serverTimestamp(),
    });

    logger.info('trocasService', 'Trocas resetadas com sucesso');
    return {
      id: trocasId,
      data: currentData.data,
      setores: resetSetores,
      total_realizado,
      total_meta,
      total_diferenca,
      usuario_id: userId,
      criado_em: currentData.criado_em,
      atualizado_em: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('trocasService', 'Erro ao resetar trocas', error);
    throw error;
  }
};

export const updateSetor = async (
  trocasId: string,
  setorId: string,
  field: 'realizado' | 'meta',
  value: number,
  _userId: string
): Promise<TrocasData | null> => {
  try {
    logger.info('trocasService', `Atualizando setor: ${setorId} em troca: ${trocasId}`);
    const docRef = doc(db, TROCAS_COLLECTION, trocasId);
    const currentSnap = await getDoc(docRef);

    if (!currentSnap.exists()) {
      return null;
    }

    const currentData = currentSnap.data();

    if (currentData.usuario_id !== _userId) {
      logger.error('trocasService', 'Tentativa de atualizar troca de outro usuario', {
        trocasId,
        userId: _userId,
        owner: currentData.usuario_id,
      });
      throw new Error('Não autorizado a alterar esta troca');
    }

    const setoresRaw = (currentData.setores || []) as Array<Record<string, unknown>>;

    const updatedSetores = setoresRaw.map((s) => {
      if (s.id === setorId) {
        return {
          ...s,
          [field]: value,
        };
      }
      return s;
    });

    const setoresWithStats = updatedSetores.map(calculateSetorStats);
    const totals = calculateTotals(setoresWithStats);

    await updateDoc(docRef, {
      setores: sanitizeSetoresForFirestore(setoresWithStats),
      ...totals,
      atualizado_em: serverTimestamp(),
    });

    const updatedSnap = await getDoc(docRef);
    logger.info('trocasService', 'Setor atualizado com sucesso');
    return docToTrocasData(updatedSnap);
  } catch (error) {
    logger.error('trocasService', 'Erro ao atualizar setor', error);
    throw error;
  }
};

export const getTrocasHistory = async (
  limitCount: number = 30
): Promise<TrocasData[]> => {
  try {
    logger.debug('trocasService', `Buscando historico`, { limitCount });
    const trocasRef = collection(db, TROCAS_COLLECTION);
    const q = query(
      trocasRef,
      orderBy('data', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    logger.debug('trocasService', `${querySnapshot.size} registros encontrados no historico`);
    return querySnapshot.docs
      .map((docSnap) => docToTrocasData(docSnap))
      .filter((item): item is TrocasData => item !== null)
      .sort((a, b) => b.data.localeCompare(a.data));
  } catch (error) {
    logger.error('trocasService', 'Erro ao buscar historico', error);
    throw error;
  }
};

export const getTrocasByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TrocasData[]> => {
  try {
    logger.debug('trocasService', `Buscando trocas por periodo`, { startDate, endDate });
    const trocasRef = collection(db, TROCAS_COLLECTION);
    const q = query(
      trocasRef,
      where('data', '>=', startDate),
      where('data', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    logger.debug('trocasService', `${querySnapshot.size} registros encontrados no periodo`);
    return querySnapshot.docs
      .map((docSnap) => docToTrocasData(docSnap))
      .filter((item): item is TrocasData => item !== null)
      .sort((a, b) => a.data.localeCompare(b.data));
  } catch (error) {
    logger.error('trocasService', 'Erro ao buscar trocas por periodo', error);
    throw error;
  }
};

export const getOrCreateTrocas = async (
  date: string,
  userId: string
): Promise<TrocasData | null> => {
  logger.info('trocasService', `getOrCreateTrocas: ${date}`, { userId });

  const existingData = await getTrocasByDate(date, userId);

  if (existingData) {
    logger.info('trocasService', 'Retornando dados existentes');
    return existingData;
  }

  logger.info('trocasService', 'Dados não encontrados, criando novos...');
  return createTrocas(date, userId);
};
