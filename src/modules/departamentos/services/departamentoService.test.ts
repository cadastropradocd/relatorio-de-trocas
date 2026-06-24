import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/services/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _isServerTimestamp: true })),
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

const mockGetDocs = vi.mocked((await import('firebase/firestore')).getDocs);
const mockSetDoc = vi.mocked((await import('firebase/firestore')).setDoc);
const mockDeleteDoc = vi.mocked((await import('firebase/firestore')).deleteDoc);
const mockUpdateDoc = vi.mocked((await import('firebase/firestore')).updateDoc);
const mockQuery = vi.mocked((await import('firebase/firestore')).query);
const mockCollection = vi.mocked((await import('firebase/firestore')).collection);
const mockDoc = vi.mocked((await import('firebase/firestore')).doc);
const mockWhere = vi.mocked((await import('firebase/firestore')).where);

const {
  getAllDepartamentos,
  getDepartamentosAtivos,
  createDepartamento,
  updateDepartamento,
  deleteDepartamento,
} = await import('../services/departamentoService');

describe('departamentoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({});
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockWhere.mockReturnValue({});
  });

  describe('getAllDepartamentos', () => {
    it('deve retornar lista ordenada por ordem', async () => {
      const mockDocSnap1 = {
        id: 'd1',
        data: () => ({
          nome: 'Bazar',
          meta_mensal: 5000,
          ativo: true,
          ordem: 2,
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      const mockDocSnap2 = {
        id: 'd2',
        data: () => ({
          nome: 'Açougue',
          meta_mensal: 3000,
          ativo: true,
          ordem: 1,
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap1, mockDocSnap2], size: 2 });

      const result = await getAllDepartamentos();
      expect(result.length).toBe(2);
      expect(result[0].ordem).toBe(1);
      expect(result[1].ordem).toBe(2);
    });

    it('deve retornar array vazio quando não há departamentos', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });
      const result = await getAllDepartamentos();
      expect(result).toEqual([]);
    });

    it('deve propagar erro do Firestore', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));
      await expect(getAllDepartamentos()).rejects.toThrow('Firestore error');
    });
  });

  describe('getDepartamentosAtivos', () => {
    it('deve retornar apenas departamentos ativos', async () => {
      const mockDocSnap = {
        id: 'd1',
        data: () => ({
          nome: 'Açougue',
          meta_mensal: 3000,
          ativo: true,
          ordem: 1,
          criado_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap], size: 1 });

      const result = await getDepartamentosAtivos();
      expect(result.length).toBe(1);
      expect(result[0].ativo).toBe(true);
    });
  });

  describe('createDepartamento', () => {
    it('deve criar departamento com validações', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });
      mockSetDoc.mockResolvedValue(undefined);

      const result = await createDepartamento('Novo Depto', 1000);
      expect(result.nome).toBe('Novo Depto');
      expect(result.meta_mensal).toBe(1000);
      expect(result.ativo).toBe(true);
      expect(result.ordem).toBe(1);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('deve lançar erro se nome vazio', async () => {
      await expect(createDepartamento('', 1000)).rejects.toThrow('Nome do departamento é obrigatório');
    });

    it('deve lançar erro se meta negativa', async () => {
      await expect(createDepartamento('Teste', -100)).rejects.toThrow('Meta mensal não pode ser negativa');
    });

    it('deve calcular ordem baseada no máximo existente', async () => {
      const mockDocSnap = {
        id: 'd1',
        data: () => ({ ordem: 5 }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap], size: 1 });
      mockSetDoc.mockResolvedValue(undefined);

      const result = await createDepartamento('Teste', 1000);
      expect(result.ordem).toBe(6);
    });
  });

  describe('updateDepartamento', () => {
    it('deve atualizar campos fornecidos', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateDepartamento('d1', { nome: 'Novo Nome', meta_mensal: 2000 });
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('deve atualizar apenas campos definidos', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateDepartamento('d1', { ativo: false });
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('deleteDepartamento', () => {
    it('deve deletar documento', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      await deleteDepartamento('d1');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });
});