import { v4 as uuidv4 } from 'uuid';
import type { Setor } from '../types/trocas';
import { getStatusFromDifference } from './formatters';

export const calculateSetorStats = (setor: Partial<Setor> & { realizado: number; meta: number }): Setor => {
  const realized = setor.realizado ?? 0;
  const target = setor.meta ?? 0;
  const difference = realized - target;
  const percentage = target > 0 ? (difference / target) * 100 : 0;

  return {
    id: setor.id ?? uuidv4(),
    categoria: setor.categoria ?? '',
    realizado: realized,
    meta: target,
    diferenca: difference,
    percentual: percentage,
    status: getStatusFromDifference(difference),
    criado_em: setor.criado_em,
    atualizado_em: setor.atualizado_em,
  };
};
