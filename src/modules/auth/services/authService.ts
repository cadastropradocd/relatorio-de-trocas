import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../shared/services/firebase';
import type { User } from '../../../shared/types/trocas';
import { usernameToEmail, convertFirestoreTimestamp } from '../../../shared/utils/auth';
import { logger } from '../../../shared/utils/logger';

export interface AuthError {
  message: string;
}

const firebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  const fallback: User = {
    id: firebaseUser.uid,
    username: firebaseUser.email?.split('@')[0] || '',
    email: firebaseUser.email || '',
    name: firebaseUser.displayName ?? null,
    avatar_url: firebaseUser.photoURL ?? null,
    role: 'user',
    criado_em: firebaseUser.metadata.creationTime || new Date().toISOString(),
  };

  try {
    const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

    if (!userDoc.exists()) {
      return fallback;
    }

    const data = userDoc.data();
    return {
      ...fallback,
      username: (data['username'] as string) ?? fallback.username,
      name: (data['name'] as string) ?? fallback.name,
      avatar_url: (data['avatar_url'] as string) ?? fallback.avatar_url,
      role: (data['role'] as 'admin' | 'user') ?? 'user',
      criado_em: convertFirestoreTimestamp(data['criado_em']),
    };
  } catch {
    return fallback;
  }
};

export const signIn = async (username: string, password: string): Promise<AuthError | null> => {
  try {
    logger.info('authService', 'Iniciando login', { username });
    const email = username.includes('@') ? username : usernameToEmail(username);
    await signInWithEmailAndPassword(auth, email, password);
    logger.info('authService', 'Login realizado com sucesso');
    return null;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || 'auth/unknown-error';
    const message = getFirebaseAuthErrorMessage(code);
    logger.error('authService', 'Erro ao fazer login', { code, message });
    return { message };
  }
};

export const signUp = async (
  username: string,
  password: string,
  name: string
): Promise<AuthError | null> => {
  try {
    logger.info('authService', 'Criando nova conta', { username });
    const email = usernameToEmail(username);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: name });

    try {
      await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
        username,
        email,
        name,
        avatar_url: null,
        role: 'user',
        criado_em: serverTimestamp(),
      });
    } catch {
      await firebaseUser.delete().catch(() => {});
      return { message: 'Erro ao criar perfil. Tente novamente.' };
    }

    logger.info('authService', 'Conta criada com sucesso');
    return null;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || 'auth/unknown-error';
    const message = getFirebaseAuthErrorMessage(code);
    logger.error('authService', 'Erro ao criar conta', { code, message });
    return { message };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    logger.info('authService', 'Fazendo logout');
    await firebaseSignOut(auth);
    logger.info('authService', 'Logout realizado com sucesso');
  } catch (error: unknown) {
    logger.error('authService', 'Erro ao fazer logout', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (!firebaseUser) {
        resolve(null);
        return;
      }
      const user = await firebaseUserToUser(firebaseUser);
      resolve(user);
    });
  });
};

export const onAuthStateChange = (
  callback: (event: string) => void
): { data: { subscription: { unsubscribe: () => void } } } => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      await firebaseUserToUser(firebaseUser);
      callback('SIGNED_IN');
    } else {
      callback('SIGNED_OUT');
    }
  });

  return {
    data: {
      subscription: { unsubscribe },
    },
  };
};

const getFirebaseAuthErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este nome de usuario ja esta cadastrado.',
    'auth/invalid-email': 'Nome de usuario invalido.',
    'auth/operation-not-allowed': 'Operacao nao permitida.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-disabled': 'Esta conta foi desabilitada.',
    'auth/user-not-found': 'Usuario nao encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Usuario ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Erro de conexao. Verifique sua internet.',
    'auth/popup-closed-by-user': 'Janela de login fechada.',
    'auth/missing-email': 'Informe um nome de usuario.',
  };
  return messages[code] || 'Erro ao autenticar. Tente novamente.';
};
