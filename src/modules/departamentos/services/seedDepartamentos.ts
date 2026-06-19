import { collection, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../../shared/services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../shared/utils/logger';

const DEFAULT_DEPARTAMENTOS = [
  { nome: 'AÇOUGUE', meta_mensal: 3000, ordem: 1 },
  { nome: 'BAZAR/ELETRO/FLORES', meta_mensal: 5000, ordem: 2 },
  { nome: 'PETSHOP', meta_mensal: 2000, ordem: 3 },
  { nome: 'BEBIDAS', meta_mensal: 7000, ordem: 4 },
  { nome: 'FLC', meta_mensal: 18000, ordem: 5 },
  { nome: 'HIGIENE', meta_mensal: 3500, ordem: 6 },
  { nome: 'PADARIA', meta_mensal: 4000, ordem: 7 },
  { nome: 'LIMPEZA', meta_mensal: 3500, ordem: 8 },
  { nome: 'MERCEARIA', meta_mensal: 47000, ordem: 9 },
];

export const seedDepartamentos = async (): Promise<{ created: number; skipped: number }> => {
  logger.info('seedDepartamentos', 'Iniciando seed...');

  const snapshot = await getDocs(collection(db, 'departamentos'));
  logger.info('seedDepartamentos', `Documentos existentes: ${snapshot.size}`);

  if (!snapshot.empty) {
    logger.info('seedDepartamentos', 'Coleção já possui dados, pulando seed');
    return { created: 0, skipped: snapshot.size };
  }

  let created = 0;
  for (const dep of DEFAULT_DEPARTAMENTOS) {
    const id = uuidv4();
    logger.debug('seedDepartamentos', `Criando: ${dep.nome}`, { id, meta: dep.meta_mensal });

    await setDoc(doc(db, 'departamentos', id), {
      ...dep,
      ativo: true,
      criado_em: serverTimestamp(),
      atualizado_em: serverTimestamp(),
    });
    created++;
  }

  logger.info('seedDepartamentos', `Seed concluído: ${created} departamentos criados`);
  return { created, skipped: 0 };
};
