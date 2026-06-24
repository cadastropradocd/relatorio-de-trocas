import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/services/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _isServerTimestamp: true })),
}));

vi.mock('../../departamentos/services/departamentoService', () => ({
  getDepartamentosAtivos: vi.fn(),
}));

vi.mock('../../../shared/utils/auth', () => ({
  convertFirestoreTimestamp: (v: unknown) => {
    if (v && typeof v === 'object' && 'toDate' in v) {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof v === 'string') return v;
    return new Date().toISOString();
  },
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../shared/utils/setores', () => ({
  calculateSetorStats: vi.fn((s) => ({
    id: s.id || 'test-id',
    categoria: s.categoria || 'Teste',
    realizado: s.realizado || 0,
    meta: s.meta || 0,
    diferenca: (s.realizado || 0) - (s.meta || 0),
    percentual: s.meta > 0 ? (((s.realizado || 0) - (s.meta || 0)) / s.meta) * 100 : 0,
    status: (s.realizado || 0) > (s.meta || 0) ? 'negativo' : (s.realizado || 0) < (s.meta || 0) ? 'positivo' : 'neutro',
    criado_em: s.criado_em,
    atualizado_em: s.atualizado_em,
  })),
}));

const mockGetDocs = vi.mocked((await import('firebase/firestore')).getDocs);
const mockGetDoc = vi.mocked((await import('firebase/firestore')).getDoc);
const mockSetDoc = vi.mocked((await import('firebase/firestore')).setDoc);
const mockUpdateDoc = vi.mocked((await import('firebase/firestore')).updateDoc);
const mockQuery = vi.mocked((await import('firebase/firestore')).query);
const mockCollection = vi.mocked((await import('firebase/firestore')).collection);
const mockDoc = vi.mocked((await import('firebase/firestore')).doc);
const mockWhere = vi.mocked((await import('firebase/firestore')).where);
const mockOrderBy = vi.mocked((await import('firebase/firestore')).orderBy);
const mockLimit = vi.mocked((await import('firebase/firestore')).limit);
const mockStartAfter = vi.mocked((await import('firebase/firestore')).startAfter);
const mockGetDepartamentosAtivos = vi.mocked((await import('../../departamentos/services/departamentoService')).getDepartamentosAtivos);

const {
  getTrocasByDate,
  createTrocas,
  updateTrocas,
  resetTrocas,
  updateSetor,
  getTrocasHistory,
  getTrocasByDateRange,
} = await import('../services/trocasService');

describe('trocasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({});
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockLimit.mockReturnValue({});
    mockStartAfter.mockReturnValue({});
  });

  describe('getTrocasByDate', () => {
    it('deve retornar null quando não há documento', async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await getTrocasByDate('2026-01-01');
      expect(result).toBeNull();
    });

    it('deve retornar dados quando documento existe', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-123',
        data: () => ({
          data: '2026-01-01',
          setores: [{ id: 's1', categoria: 'Açougue', realizado: 100, meta: 200 }],
          total_realizado: 100,
          total_meta: 200,
          total_diferenca: -100,
          usuario_id: 'user-1',
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDocs.mockResolvedValue({ empty: false, docs: [mockDocSnap] });

      const result = await getTrocasByDate('2026-01-01');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('doc-123');
    });

    it('deve propagar erro do Firestore', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));
      await expect(getTrocasByDate('2026-01-01')).rejects.toThrow('Firestore error');
    });
  });

  describe('createTrocas', () => {
    it('deve criar trocas com departamentos ativos', async () => {
      mockGetDepartamentosAtivos.mockResolvedValue([
        { id: 'd1', nome: 'Açougue', meta_mensal: 3000, ativo: true, ordem: 1, criado_em: '', atualizado_em: '' },
      ]);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await createTrocas('2026-01-01', 'user-1');
      expect(result).not.toBeNull();
      expect(result?.usuario_id).toBe('user-1');
      expect(result?.setores.length).toBe(1);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('deve retornar null quando não há departamentos ativos', async () => {
      mockGetDepartamentosAtivos.mockResolvedValue([]);
      const result = await createTrocas('2026-01-01', 'user-1');
      expect(result).toBeNull();
    });

    it('deve usar setores fornecidos se existirem', async () => {
      const setores = [{ id: 's1', categoria: 'Teste', realizado: 100, meta: 200 }];
      mockSetDoc.mockResolvedValue(undefined);

      const result = await createTrocas('2026-01-01', 'user-1', setores);
      expect(result).not.toBeNull();
      expect(result?.setores.length).toBe(1);
    });
  });

  describe('updateTrocas', () => {
    it('deve atualizar trocas existentes', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-123',
        data: () => ({
          data: '2026-01-01',
          setores: [{ id: 's1', categoria: 'Açougue', realizado: 150, meta: 200 }],
          total_realizado: 150,
          total_meta: 200,
          total_diferenca: -50,
          usuario_id: 'user-1',
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);
      mockUpdateDoc.mockResolvedValue(undefined);

      const setores = [{ id: 's1', categoria: 'Açougue', realizado: 150, meta: 200 }];
      const result = await updateTrocas('doc-123', setores, 'user-1');
      expect(result).not.toBeNull();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('deve retornar null quando documento não existe', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });
      const result = await updateTrocas('inexistente', [], 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('resetTrocas', () => {
    it('deve zerar realizado mantendo meta', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-123',
        data: () => ({
          data: '2026-01-01',
          setores: [{ id: 's1', categoria: 'Açougue', realizado: 100, meta: 200 }],
          total_realizado: 100,
          total_meta: 200,
          total_diferenca: -100,
          usuario_id: 'user-1',
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({});

      const result = await resetTrocas('doc-123', 'user-1');
      expect(result).not.toBeNull();
      expect(result?.total_realizado).toBe(0);
      expect(result?.total_diferenca).toBe(-200);
    });
  });

  describe('updateSetor', () => {
    it('deve atualizar campo específico do setor', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-123',
        data: () => ({
          data: '2026-01-01',
          setores: [{ id: 's1', categoria: 'Açougue', realizado: 100, meta: 200 }],
          total_realizado: 100,
          total_meta: 200,
          total_diferenca: -100,
          usuario_id: 'user-1',
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({});

      const result = await updateSetor('doc-123', 's1', 'realizado', 150, 'user-1');
      expect(result).not.toBeNull();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('deve lançar erro se tentar atualizar troca de outro usuário', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-123',
        data: () => ({
          usuario_id: 'outro-user',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDocSnap);

      await expect(updateSetor('doc-123', 's1', 'realizado', 150, 'user-1'))
        .rejects.toThrow('Não autorizado a alterar esta troca');
    });
  });

  describe('getTrocasHistory', () => {
    it('deve retornar histórico ordenado', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-1',
        data: () => ({
          data: '2026-01-01',
          setores: [],
          total_realizado: 0,
          total_meta: 0,
          total_diferenca: 0,
          usuario_id: 'user-1',
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap], size: 1 });

      const result = await getTrocasHistory(10);
      expect(result.length).toBe(1);
    });
  });

  describe('getTrocasByDateRange', () => {
    it('deve buscar trocas no intervalo de datas', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'doc-1',
        data: () => ({
          data: '2026-01-15',
          setores: [],
          total_realizado: 100,
          total_meta: 200,
          total_diferenca: -100,
          usuario_id: 'user-1',
          criado_em: '2026-01-15T00:00:00Z',
          atualizado_em: '2026-01-15T00:00:00Z',
        }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap] });

      const result = await getTrocasByDateRange('2026-01-01', '2026-01-31');
      expect(result.length).toBe(1);
    });
  });


});