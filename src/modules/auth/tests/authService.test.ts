import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signUp, signOut, onAuthStateChange } from '../services/authService';

const { mockSignIn, mockCreateUser, mockSignOut, mockOnAuthStateChanged, mockGetDoc } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockCreateUser: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChanged: vi.fn(),
  mockGetDoc: vi.fn().mockResolvedValue({
    exists: () => false,
    data: () => undefined,
  }),
}));

vi.mock('../../../shared/services/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: mockSignIn,
    createUserWithEmailAndPassword: mockCreateUser,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
  },
  db: {
    doc: vi.fn(),
    getDoc: mockGetDoc,
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn(),
  },
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('deve retornar null quando o login for bem-sucedido', async () => {
      mockSignIn.mockResolvedValue({
        user: { uid: '123', email: 'test@example.com' },
      });

      const result = await signIn('test@example.com', 'password123');
      expect(result).toBeNull();
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('deve retornar erro quando o login falhar', async () => {
      mockSignIn.mockRejectedValue({
        code: 'auth/invalid-credential',
      });

      const result = await signIn('test@example.com', 'wrongpassword');
      expect(result).toEqual({ message: 'Usuario ou senha incorretos.' });
    });
  });

  describe('signUp', () => {
    it('deve retornar null quando o cadastro for bem-sucedido', async () => {
      mockCreateUser.mockResolvedValue({
        user: {
          uid: '123',
          email: 'test@example.com',
          displayName: null,
          photoURL: null,
          metadata: { creationTime: '2023-01-01' },
        },
      });

      const result = await signUp('testuser', 'password123', 'Test User');
      expect(result).toBeNull();
      expect(mockCreateUser).toHaveBeenCalled();
    });

    it('deve retornar erro quando o cadastro falhar', async () => {
      mockCreateUser.mockRejectedValue({
        code: 'auth/email-already-in-use',
      });

      const result = await signUp('testuser', 'password123', 'Test User');
      expect(result).toEqual({ message: 'Este nome de usuario ja esta cadastrado.' });
    });
  });

  describe('signOut', () => {
    it('deve chamar signOut do Firebase', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await signOut();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('onAuthStateChange', () => {
    it('deve chamar o callback quando o estado de autenticacao mudar', async () => {
      const callback = vi.fn();

      mockOnAuthStateChanged.mockImplementation(
        (_authInstance: unknown, firebaseCallback: (user: unknown) => void) => {
          firebaseCallback({
            uid: '123',
            email: 'test@example.com',
            displayName: null,
            photoURL: null,
            metadata: { creationTime: '2023-01-01' },
          });
          return vi.fn();
        }
      );

      onAuthStateChange(callback);
      expect(mockOnAuthStateChanged).toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith('SIGNED_IN');
    });
  });
});
