import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTrocasByDate, createTrocas, updateTrocas } from '../services/trocasService';
import { getDepartamentosAtivos } from '../../departamentos/services/departamentoService';
import { logger } from '../../../shared/utils/logger';
import { calculateSetorStats } from '../../../shared/utils/setores';
import type { TrocasData, Setor } from '../../../shared/types/trocas';

interface UseTrocasReturn {
  trocas: TrocasData | null;
  departamentos: Setor[];
  loading: boolean;
  error: string | null;
  hasChanges: boolean;
  updateSetor: (id: string, field: 'realizado' | 'meta', value: number) => void;
  saveAll: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useTrocas = (date: string): UseTrocasReturn => {
  const { user } = useAuth();
  const [trocas, setTrocas] = useState<TrocasData | null>(null);
  const [departamentos, setDepartamentos] = useState<Setor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const loadTrocas = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasChanges(false);

    logger.info('useTrocas', `Carregando trocas para ${date}`);

    try {
      const existingData = await getTrocasByDate(date);

      if (existingData) {
        logger.info('useTrocas', `Dados existentes: ${existingData.setores.length} setores`);
        setTrocas(existingData);
        setDepartamentos([]);
      } else {
        logger.info('useTrocas', 'Nenhum documento, buscando departamentos');
        const deps = await getDepartamentosAtivos();

        if (deps.length > 0) {
          const setoresVazios = deps.map((d) => calculateSetorStats({
            id: d.id,
            categoria: d.nome,
            realizado: 0,
            meta: d.meta_mensal,
          }));

          setDepartamentos(setoresVazios);
          setTrocas(null);
        } else {
          setDepartamentos([]);
          setTrocas(null);
        }
      }
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      const errorCode = errorObj.code || 'unknown';
      const errorMessage = errorObj.message || String(err);

      logger.error('useTrocas', `Erro ao carregar dados: ${errorCode}`, {
        code: errorCode,
        message: errorMessage,
        date,
        userId: user.id,
        fullError: err,
      });

      if (errorCode === 'permission-denied') {
        setError(`Erro de permissão: você não tem acesso a estes dados. (${errorCode})`);
      } else if (errorCode === 'unavailable') {
        setError(`Firestore indisponível. Verifique sua conexão. (${errorCode})`);
      } else {
        setError(`Erro ao carregar dados: ${errorMessage} (${errorCode})`);
      }
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  const updateSetor = useCallback(
    (setorId: string, field: 'realizado' | 'meta', value: number): void => {
      const setoresAtuais = trocas?.setores || departamentos;
      if (setoresAtuais.length === 0) return;

      const updatedSetores = setoresAtuais.map((s) => {
        if (s.id === setorId) {
          return calculateSetorStats({ ...s, [field]: value });
        }
        return s;
      });

      if (trocas) {
        const total_realizado = updatedSetores.reduce((sum, s) => sum + s.realizado, 0);
        const total_meta = updatedSetores.reduce((sum, s) => sum + s.meta, 0);
        const total_diferenca = total_realizado - total_meta;

        setTrocas((prev) => prev ? {
          ...prev,
          setores: updatedSetores,
          total_realizado,
          total_meta,
          total_diferenca,
        } : prev);
      } else {
        setDepartamentos(updatedSetores);
      }

      setHasChanges(true);
    },
    [trocas, departamentos]
  );

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const setoresFinais = trocas?.setores || departamentos;
    if (setoresFinais.length === 0) return false;

    logger.info('useTrocas', 'Salvando dados...', { setoresCount: setoresFinais.length });

    try {
      if (trocas) {
        const updatedData = await updateTrocas(trocas.id, setoresFinais, user.id);
        if (updatedData) {
          setTrocas(updatedData);
          setHasChanges(false);
          logger.info('useTrocas', 'Dados atualizados com sucesso');
          return true;
        }
      } else {
        const newData = await createTrocas(date, user.id, setoresFinais);
        if (newData) {
          setTrocas(newData);
          setDepartamentos([]);
          setHasChanges(false);
          logger.info('useTrocas', 'Novo documento criado com sucesso');
          return true;
        }
      }

      logger.warn('useTrocas', 'Save retornou null');
      return false;
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      logger.error('useTrocas', `Erro ao salvar: ${errorObj.code || 'unknown'}`, {
        error: err,
      });
      return false;
    }
  }, [user, trocas, departamentos, date]);

  useEffect(() => {
    loadTrocas();
  }, [loadTrocas]);

  return {
    trocas,
    departamentos,
    loading,
    error,
    hasChanges,
    updateSetor,
    saveAll,
    refresh: loadTrocas,
  };
};

export default useTrocas;
