import type { StatusType } from '../types/trocas';

/**
 * Formatting helpers for the application.
 */

/**
 * Formats a number as Brazilian currency.
 */
export const formatBRL = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formats a number for editing inputs.
 */
export const formatarNumeroEdicao = (valor: number): string => {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Parses a BR formatted string into a number.
 */
export const parseNumeroBR = (valorTexto: string): number | null => {
  const textoOriginal = String(valorTexto || '').trim();
  if (!textoOriginal) return null;

  const limpo = textoOriginal
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  if (!limpo || limpo === '-' || limpo === '.' || limpo === '-.') return null;

  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
};

/**
 * Returns the status type based on the difference.
 * Rule: above the limit = negative, below = positive, equal = neutral.
 */
export const getStatusFromDifference = (diferenca: number): StatusType => {
  if (diferenca > 0) return 'negativo';
  if (diferenca < 0) return 'positivo';
  return 'neutro';
};

/**
 * Returns the status type from realized and target values.
 */
export const getStatusFromValues = (realizado: number, meta: number): StatusType => {
  return getStatusFromDifference(realizado - meta);
};

/**
 * Formats the difference with an indicator arrow.
 */
export const formatarDiferenca = (valor: number): string => {
  const valorFormatado = formatBRL(Math.abs(valor));
  if (valor > 0) return `${valorFormatado} ↑`;
  if (valor < 0) return `${valorFormatado} ↓`;
  return `${valorFormatado} →`;
};

/**
 * Formats the status percentage.
 */
export const formatarStatusPercentual = (realizado: number, meta: number): string => {
  if (meta === 0) return '0,00% →';
  const variacao = ((realizado - meta) / meta) * 100;
  const pct = `${Math.abs(variacao).toFixed(2).replace('.', ',')}%`;
  if (variacao > 0) return `${pct} ↑`;
  if (variacao < 0) return `${pct} ↓`;
  return `${pct} →`;
};

/**
 * Formats the total target status description.
 */
export const formatarStatusMetaTotal = (totalRealizado: number, totalMeta: number): string => {
  if (totalMeta === 0) return '0,00% na meta total';
  const variacao = ((totalRealizado - totalMeta) / totalMeta) * 100;
  const pct = `${Math.abs(variacao).toFixed(2).replace('.', ',')}%`;
  if (variacao > 0) return `${pct} acima da meta total`;
  if (variacao < 0) return `${pct} abaixo da meta total`;
  return `${pct} na meta total`;
};

/**
 * Formats a date as DD-MM-YYYY.
 */
export const formatarDataDiaMesAno = (data: Date): string => {
  return `${String(data.getDate()).padStart(2, '0')}-${String(data.getMonth() + 1).padStart(2, '0')}-${data.getFullYear()}`;
};

/**
 * Formats a date for filenames as YYYY-MM-DD.
 */
export const formatarDataArquivo = (data: Date): string => {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
};

/**
 * Normalizes text for comparison.
 */
export const normalizarTexto = (valor: string | null | undefined): string => {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Returns the CSS class based on the status.
 */
export const classeStatus = (diferenca: number): string => {
  const status = getStatusFromDifference(diferenca);
  if (status === 'negativo') return 'status-negativo';
  if (status === 'neutro') return 'status-neutro';
  return 'status-positivo';
};
