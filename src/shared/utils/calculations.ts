import type { Setor } from '../types/trocas';

export interface TotalsResult {
  total_realizado: number;
  total_meta: number;
  total_diferenca: number;
}

export const calculateTotals = (setores: Setor[]): TotalsResult => {
  const total_realizado = setores.reduce((sum, s) => sum + s.realizado, 0);
  const total_meta = setores.reduce((sum, s) => sum + s.meta, 0);
  const total_diferenca = total_realizado - total_meta;
  return { total_realizado, total_meta, total_diferenca };
};
