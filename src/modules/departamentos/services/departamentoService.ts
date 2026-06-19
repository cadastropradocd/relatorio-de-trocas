import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../shared/services/firebase';
import { v4 as uuidv4 } from 'uuid';
import type { Departamento } from '../../../shared/types/trocas';
import { convertFirestoreTimestamp } from '../../../shared/utils/auth';
import { logger } from '../../../shared/utils/logger';

const DEPARTAMENTOS_COLLECTION = 'departamentos';

const docToDepartamento = (docSnap: { id: string; data(): Record<string, unknown> }): Departamento => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    nome: (data.nome as string) || '',
    meta_mensal: (data.meta_mensal as number) || 0,
    ativo: (data.ativo as boolean) ?? true,
    ordem: (data.ordem as number) || 0,
    criado_em: convertFirestoreTimestamp(data.criado_em),
    atualizado_em: convertFirestoreTimestamp(data.atualizado_em),
  };
};

export const getAllDepartamentos = async (): Promise<Departamento[]> => {
  try {
    logger.debug('departamentoService', 'Buscando todos os departamentos');
    const snapshot = await getDocs(collection(db, DEPARTAMENTOS_COLLECTION));
    logger.debug('departamentoService', `${snapshot.size} departamentos encontrados`);
    const departamentos = snapshot.docs.map(docToDepartamento);
    return departamentos.sort((a, b) => a.ordem - b.ordem);
  } catch (error) {
    logger.error('departamentoService', 'Erro ao buscar departamentos', error);
    throw error;
  }
};

export const getDepartamentosAtivos = async (): Promise<Departamento[]> => {
  try {
    logger.info('departamentoService', 'Buscando departamentos ativos');
    const all = await getAllDepartamentos();
    const ativos = all.filter((d) => d.ativo);
    logger.debug('departamentoService', `${ativos.length} departamentos ativos encontrados`);
    return ativos;
  } catch (error) {
    logger.error('departamentoService', 'Erro ao buscar departamentos ativos', error);
    throw error;
  }
};

export const createDepartamento = async (
  nome: string,
  metaMensal: number
): Promise<Departamento> => {
  try {
    if (!nome || nome.trim().length === 0) {
      throw new Error('Nome do departamento é obrigatório');
    }
    if (metaMensal < 0) {
      throw new Error('Meta mensal não pode ser negativa');
    }

    logger.info('departamentoService', `Criando departamento: ${nome}`, { metaMensal });
    const all = await getAllDepartamentos();
    const maxOrdem = all.reduce((max, d) => Math.max(max, d.ordem), 0);

    const id = uuidv4();
    const now = new Date().toISOString();

    const data = {
      nome: nome.trim(),
      meta_mensal: metaMensal,
      ativo: true,
      ordem: maxOrdem + 1,
      criado_em: serverTimestamp(),
      atualizado_em: serverTimestamp(),
    };

    await setDoc(doc(db, DEPARTAMENTOS_COLLECTION, id), data);

    logger.info('departamentoService', 'Departamento criado com sucesso');

    return {
      id,
      nome: nome.trim(),
      meta_mensal: metaMensal,
      ativo: true,
      ordem: maxOrdem + 1,
      criado_em: now,
      atualizado_em: now,
    };
  } catch (error) {
    logger.error('departamentoService', 'Erro ao criar departamento', error);
    throw error;
  }
};

export const updateDepartamento = async (
  id: string,
  updates: Partial<Pick<Departamento, 'nome' | 'meta_mensal' | 'ativo' | 'ordem'>>
): Promise<void> => {
  try {
    logger.info('departamentoService', `Atualizando departamento: ${id}`);
    const docRef = doc(db, DEPARTAMENTOS_COLLECTION, id);
    const firestoreUpdates: Record<string, unknown> = { atualizado_em: serverTimestamp() };

    if (updates.nome !== undefined) firestoreUpdates.nome = updates.nome.trim();
    if (updates.meta_mensal !== undefined) firestoreUpdates.meta_mensal = updates.meta_mensal;
    if (updates.ativo !== undefined) firestoreUpdates.ativo = updates.ativo;
    if (updates.ordem !== undefined) firestoreUpdates.ordem = updates.ordem;

    await updateDoc(docRef, firestoreUpdates);
    logger.info('departamentoService', 'Departamento atualizado com sucesso');
  } catch (error) {
    logger.error('departamentoService', 'Erro ao atualizar departamento', error);
    throw error;
  }
};

export const deleteDepartamento = async (id: string): Promise<void> => {
  try {
    logger.info('departamentoService', `Deletando departamento: ${id}`);
    await deleteDoc(doc(db, DEPARTAMENTOS_COLLECTION, id));
  } catch (error) {
    logger.error('departamentoService', 'Erro ao deletar departamento', error);
    throw error;
  }
};
