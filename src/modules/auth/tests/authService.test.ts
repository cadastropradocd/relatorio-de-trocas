import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/services/firebase', () => ({
  db: { collection: vi.fn() },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
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

const mockGetDocs = vi.mocked((await import('firebase/firestore')).getDocs);

const { signIn, signUp, signOut, getCurrentUser } = await import('../services/authService');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('signIn', () => {
    it('deve retornar erro quando o usuário não existe', async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await signIn('naoexiste', 'password123');
      expect(result).toEqual({ message: 'Usuário ou senha incorretos.' });
    });

    it('deve retornar erro quando a senha está incorreta', async () => {
      const mockUserDoc = {
        id: 'user-123',
        data: () => ({
          username: 'testuser',
          email: 'testuser@trocas.app',
          name: 'Test User',
          password_hash: 'hash_diferente',
          role: 'user',
          criado_em: '2026-01-01',
        }),
      };

      mockGetDocs.mockResolvedValue({ empty: false, docs: [mockUserDoc] });

      const result = await signIn('testuser', 'senhaerrada');
      expect(result).toEqual({ message: 'Usuário ou senha incorretos.' });
    });
  });

  describe('signUp', () => {
    it('deve retornar null quando o cadastro for bem-sucedido', async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      vi.mocked((await import('firebase/firestore')).setDoc).mockResolvedValue(undefined);

      const result = await signUp('novouser', 'password123', 'Novo User');
      expect(result).toBeNull();
    });

    it('deve retornar erro quando o username já existe', async () => {
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'existing', data: () => ({ username: 'testuser' }) }],
      });

      const result = await signUp('testuser', 'password123', 'Test User');
      expect(result).toEqual({ message: 'Este nome de usuário já está cadastrado.' });
    });
  });

  describe('signOut', () => {
    it('deve limpar a sessão do localStorage', async () => {
      localStorage.setItem('trocas_session', JSON.stringify({ user: {}, timestamp: Date.now() }));
      await signOut();
      expect(localStorage.getItem('trocas_session')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('deve retornar null quando não há sessão', async () => {
      const result = await getCurrentUser();
      expect(result).toBeNull();
    });

    it('deve retornar o usuário quando a sessão ainda está válida', async () => {
      localStorage.setItem('trocas_session', JSON.stringify({
        user: { username: 'test' },
        timestamp: Date.now() - 23 * 60 * 60 * 1000,
      }));

      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'user-123',
          data: () => ({
            username: 'test',
            email: 'test@trocas.app',
            name: 'Test User',
            role: 'user',
            criado_em: '2026-01-01',
          }),
        }],
      });

      const result = await getCurrentUser();
      expect(result?.username).toBe('test');
    });

    it('deve retornar null quando a sessão expirou', async () => {
      localStorage.setItem('trocas_session', JSON.stringify({
        user: { username: 'test' },
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
      }));

      const result = await getCurrentUser();
      expect(result).toBeNull();
    });
  });
});
