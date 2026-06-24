/**
 * Utilitários de formatação para a aplicação
 */

/**
 * Formata um número como moeda brasileira (Real)
 * @param valor - Valor numérico a ser formatado
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export const formatBRL = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formata número para edição (com vírgula como separador decimal)
 * @param valor - Valor numérico
 * @returns String formatada para input (ex: "1.234,56")
 */
export const formatarNumeroEdicao = (valor: number): string => {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Parseia uma string formatada em BR para número
 * @param valorTexto - Texto a ser parseado (ex: "R$ 1.234,56" ou "1.234,56")
 * @returns Número ou null se inválido
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
 * Formata a diferença com seta indicadora
 * @param valor - Valor da diferença
 * @returns String com formatação e seta (ex: "R$ 100,00 ↑")
 */
export const formatarDiferenca = (valor: number): string => {
  const valorFormatado = formatBRL(Math.abs(valor));
  if (valor > 0) return `${valorFormatado} ↑`;
  if (valor < 0) return `${valorFormatado} ↓`;
  return `${valorFormatado} →`;
};

/**
 * Formata status percentual
 * @param realizado - Valor realizado
 * @param meta - Meta
 * @returns String formatada com percentual e seta
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
 * Formata status da meta total
 * @param totalRealizado - Total realizado
 * @param totalMeta - Total meta
 * @returns String descritiva
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
 * Formata data como DD-MM-YYYY
 * @param data - Objeto Date
 * @returns String formatada (ex: "18-06-2026")
 */
export const formatarDataDiaMesAno = (data: Date): string => {
  return `${String(data.getDate()).padStart(2, '0')}-${String(data.getMonth() + 1).padStart(2, '0')}-${data.getFullYear()}`;
};

/**
 * Formata data para nome de arquivo (YYYY-MM-DD)
 * @param data - Objeto Date
 * @returns String formatada (ex: "2026-06-18")
 */
export const formatarDataArquivo = (data: Date): string => {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
};

/**
 * Normaliza texto para comparação (remove acentos e converts para lowercase)
 * @param valor - Texto a normalizar
 * @returns Texto normalizado
 */
export const normalizarTexto = (valor: string | null | undefined): string => {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Retorna classe CSS baseada no status da diferença
 * Regra: >0 = negativo (ruim), =0 = neutro (limite), <0 = positivo (bom)
 * @param diferenca - Valor da diferença
 * @returns Classe CSS ('status-negativo', 'status-neutro' ou 'status-positivo')
 */
export const classeStatus = (diferenca: number): string => {
  if (diferenca > 0) return 'status-negativo';
  if (diferenca === 0) return 'status-neutro';
  return 'status-positivo';
};
