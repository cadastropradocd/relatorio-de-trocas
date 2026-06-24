import { describe, it, expect } from 'vitest';
import {
  formatBRL,
  formatarNumeroEdicao,
  parseNumeroBR,
  formatarDiferenca,
  formatarStatusPercentual,
  formatarStatusMetaTotal,
  formatarDataDiaMesAno,
  formatarDataArquivo,
  normalizarTexto,
  classeStatus,
} from '@/shared/utils/formatters';

describe('formatters', () => {
  describe('formatBRL', () => {
    it('deve formatar valores positivos corretamente', () => {
      expect(formatBRL(0).replace(/\u00A0/g, ' ')).toBe('R$ 0,00');
      expect(formatBRL(10).replace(/\u00A0/g, ' ')).toBe('R$ 10,00');
      expect(formatBRL(100).replace(/\u00A0/g, ' ')).toBe('R$ 100,00');
      expect(formatBRL(1000).replace(/\u00A0/g, ' ')).toBe('R$ 1.000,00');
      expect(formatBRL(1234.56).replace(/\u00A0/g, ' ')).toBe('R$ 1.234,56');
    });

    it('deve formatar valores negativos corretamente', () => {
      expect(formatBRL(-10).replace(/\u00A0/g, ' ')).toBe('-R$ 10,00');
      expect(formatBRL(-100).replace(/\u00A0/g, ' ')).toBe('-R$ 100,00');
      expect(formatBRL(-1234.56).replace(/\u00A0/g, ' ')).toBe('-R$ 1.234,56');
    });
  });

  describe('formatarNumeroEdicao', () => {
    it('deve formatar números com 2 casas decimais', () => {
      expect(formatarNumeroEdicao(0)).toBe('0,00');
      expect(formatarNumeroEdicao(10)).toBe('10,00');
      expect(formatarNumeroEdicao(100)).toBe('100,00');
      expect(formatarNumeroEdicao(1000)).toBe('1.000,00');
      expect(formatarNumeroEdicao(1234.56)).toBe('1.234,56');
    });

    it('deve formatar números negativos com 2 casas decimais', () => {
      expect(formatarNumeroEdicao(-10)).toBe('-10,00');
      expect(formatarNumeroEdicao(-1234.56)).toBe('-1.234,56');
    });
  });

  describe('parseNumeroBR', () => {
    it('deve parsear strings formatadas em BR para número', () => {
      expect(parseNumeroBR('R$ 1.234,56')).toBe(1234.56);
      expect(parseNumeroBR('1.234,56')).toBe(1234.56);
      expect(parseNumeroBR('1234,56')).toBe(1234.56);
      expect(parseNumeroBR('1.000')).toBe(1000);
      expect(parseNumeroBR('0,00')).toBe(0);
    });

    it('deve retornar null para valores inválidos', () => {
      expect(parseNumeroBR('')).toBeNull();
      expect(parseNumeroBR('abc')).toBeNull();
      expect(parseNumeroBR('R$ abc')).toBeNull();
      expect(parseNumeroBR('-')).toBeNull();
      expect(parseNumeroBR('.')).toBeNull();
      expect(parseNumeroBR('-.')).toBeNull();
    });

    it('deve parsear valores negativos', () => {
      expect(parseNumeroBR('-R$ 1.234,56')).toBe(-1234.56);
      expect(parseNumeroBR('-1.234,56')).toBe(-1234.56);
    });
  });

  describe('formatarDiferenca', () => {
    it('deve formatar diferença positiva com seta para cima', () => {
      expect(formatarDiferenca(100).replace(/\u00A0/g, ' ')).toBe('R$ 100,00 ↑');
    });

    it('deve formatar diferença negativa com seta para baixo', () => {
      expect(formatarDiferenca(-100).replace(/\u00A0/g, ' ')).toBe('R$ 100,00 ↓');
    });

    it('deve formatar diferença zero com seta neutra', () => {
      expect(formatarDiferenca(0).replace(/\u00A0/g, ' ')).toBe('R$ 0,00 →');
    });
  });

  describe('formatarStatusPercentual', () => {
    it('deve formatar percentual positivo com seta para cima', () => {
      expect(formatarStatusPercentual(120, 100)).toBe('20,00% ↑');
    });

    it('deve formatar percentual negativo com seta para baixo', () => {
      expect(formatarStatusPercentual(80, 100)).toBe('20,00% ↓');
    });

    it('deve formatar percentual zero com seta neutra', () => {
      expect(formatarStatusPercentual(100, 100)).toBe('0,00% →');
    });

    it('deve lidar com meta zero', () => {
      expect(formatarStatusPercentual(100, 0)).toBe('0,00% →');
    });
  });

  describe('formatarStatusMetaTotal', () => {
    it('deve formatar status acima da meta', () => {
      expect(formatarStatusMetaTotal(120, 100)).toBe('20,00% acima da meta total');
    });

    it('deve formatar status abaixo da meta', () => {
      expect(formatarStatusMetaTotal(80, 100)).toBe('20,00% abaixo da meta total');
    });

    it('deve formatar status na meta', () => {
      expect(formatarStatusMetaTotal(100, 100)).toBe('0,00% na meta total');
    });

    it('deve lidar com meta zero', () => {
      expect(formatarStatusMetaTotal(100, 0)).toBe('0,00% na meta total');
    });
  });

  describe('formatarDataDiaMesAno', () => {
    it('deve formatar data no formato DD-MM-YYYY', () => {
      const data = new Date(2026, 5, 18);
      expect(formatarDataDiaMesAno(data)).toBe('18-06-2026');
    });

    it('deve preencher com zeros à esquerda', () => {
      const data = new Date(2026, 0, 1);
      expect(formatarDataDiaMesAno(data)).toBe('01-01-2026');
    });
  });

  describe('formatarDataArquivo', () => {
    it('deve formatar data no formato YYYY-MM-DD', () => {
      const data = new Date(2026, 5, 18);
      expect(formatarDataArquivo(data)).toBe('2026-06-18');
    });

    it('deve preencher com zeros à esquerda', () => {
      const data = new Date(2026, 0, 1);
      expect(formatarDataArquivo(data)).toBe('2026-01-01');
    });
  });

  describe('normalizarTexto', () => {
    it('deve remover acentos e converter para minúsculas', () => {
      expect(normalizarTexto('ÁÉÍÓÚ')).toBe('aeiou');
      expect(normalizarTexto('áéíóú')).toBe('aeiou');
      expect(normalizarTexto('AÇÃO')).toBe('acao');
      expect(normalizarTexto('ação')).toBe('acao');
      expect(normalizarTexto('Teste com Espaços')).toBe('teste com espacos');
    });

    it('deve lidar com valores nulos ou indefinidos', () => {
      expect(normalizarTexto('')).toBe('');
      expect(normalizarTexto(null)).toBe('');
      expect(normalizarTexto(undefined)).toBe('');
    });
  });

  describe('classeStatus', () => {
    it('deve retornar "status-negativo" para valores positivos', () => {
      expect(classeStatus(10)).toBe('status-negativo');
      expect(classeStatus(0.1)).toBe('status-negativo');
    });

    it('deve retornar "status-neutro" para valor zero', () => {
      expect(classeStatus(0)).toBe('status-neutro');
    });

    it('deve retornar "status-positivo" para valores negativos', () => {
      expect(classeStatus(-10)).toBe('status-positivo');
      expect(classeStatus(-0.1)).toBe('status-positivo');
    });
  });
});
