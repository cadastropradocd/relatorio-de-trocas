import { v4 as uuidv4 } from 'uuid';
import type { Setor } from '../types/trocas';

export const calculateSetorStats = (setor: Partial<Setor> & { realizado: number; meta: number }): Setor => {
  const realized = setor.realizado ?? 0;
  const target = setor.meta ?? 0;
  const difference = realized - target;
  const percentage = target > 0 ? (difference / target) * 100 : 0;
  const status: 'positivo' | 'negativo' | 'neutro' =
    difference > 0 ? 'negativo' : difference < 0 ? 'positivo' : 'neutro';

  return {
    id: setor.id ?? uuidv4(),
    categoria: setor.categoria ?? '',
    realizado: realized,
    meta: target,
    diferenca: difference,
    percentual: percentage,
    status,
    criado_em: setor.criado_em,
    atualizado_em: setor.atualizado_em,
  };
};
