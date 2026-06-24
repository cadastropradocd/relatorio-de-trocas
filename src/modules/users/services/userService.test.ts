import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/services/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _isServerTimestamp: true })),
  };
});

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

vi.mock('crypto', () => ({
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
}));

const mockGetDocs = vi.mocked((await import('firebase/firestore')).getDocs);
const mockDeleteDoc = vi.mocked((await import('firebase/firestore')).deleteDoc);
const mockQuery = vi.mocked((await import('firebase/firestore')).query);
const mockCollection = vi.mocked((await import('firebase/firestore')).collection);
const mockDoc = vi.mocked((await import('firebase/firestore')).doc);
const mockWhere = vi.mocked((await import('firebase/firestore')).where);
const mockLimit = vi.mocked((await import('firebase/firestore')).limit);
const mockOrderBy = vi.mocked((await import('firebase/firestore')).orderBy);

const {
  getAllUsers,
  createUser,
  deleteUser,
} = await import('../services/userService');

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({});
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({ id: 'mock-doc-id' });
    mockWhere.mockReturnValue({});
    mockLimit.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
  });

  describe('getAllUsers', () => {
    it('deve retornar lista de usuários', async () => {
      const mockDocSnap = {
        id: 'u1',
        data: () => ({
          username: 'testuser',
          name: 'Test User',
          role: 'user',
          criado_em: '2026-01-01T00:00:00Z',
        }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap], size: 1 });

      const result = await getAllUsers();
      expect(result.length).toBe(1);
      expect(result[0].username).toBe('testuser');
    });

    it('deve retornar array vazio quando não há usuários', async () => {
      mockGetDocs.mockResolvedValue({ docs: [], size: 0 });
      const result = await getAllUsers();
      expect(result).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('deve lançar erro se username já existe', async () => {
      const mockDocSnap = {
        id: 'u1',
        data: () => ({ username: 'existing' }),
      };
      mockGetDocs.mockResolvedValue({ docs: [mockDocSnap], size: 1 });

      await expect(createUser({ username: 'existing', password: 'password123', name: 'Existing', role: 'user' }))
        .rejects.toThrow('Este nome de usuário já está cadastrado');
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({ id: 'u1' });
      await deleteUser('u1');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });
});
