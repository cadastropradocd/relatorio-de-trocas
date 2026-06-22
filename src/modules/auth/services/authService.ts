import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../../shared/services/firebase';
import type { User } from '../../../shared/types/trocas';
import { logger } from '../../../shared/utils/logger';

const USUARIOS_COLLECTION = 'usuarios';
const SESSION_KEY = 'trocas_session';

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const signIn = async (username: string, password: string): Promise<AuthError | null> => {
  try {
    logger.info('authService', `Tentando login: ${username}`);

    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('username', '==', username.trim().toLowerCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.warn('authService', 'Usuário não encontrado');
      return { message: 'Usuário ou senha incorretos.' };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const storedHash = userData.password_hash as string;

    if (!storedHash) {
      logger.error('authService', 'Usuário sem senha_hash');
      return { message: 'Erro ao autenticar. Tente novamente.' };
    }

    const inputHash = await hashPassword(password);

    if (inputHash !== storedHash) {
      logger.warn('authService', 'Senha incorreta');
      return { message: 'Usuário ou senha incorretos.' };
    }

    const user: User = {
      id: userDoc.id,
      username: userData.username as string,
      email: userData.email as string || '',
      name: userData.name as string || null,
      avatar_url: userData.avatar_url as string || null,
      role: userData.role as 'admin' | 'user',
      criado_em: userData.criado_em as string || new Date().toISOString(),
    };

    const session = { user, timestamp: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    logger.info('authService', 'Login realizado com sucesso');
    return null;
  } catch (error) {
    logger.error('authService', 'Erro ao fazer login', error);
    return { message: 'Erro ao autenticar. Tente novamente.' };
  }
};

export const signUp = async (
  username: string,
  password: string,
  name: string
): Promise<AuthError | null> => {
  try {
    logger.info('authService', `Criando conta: ${username}`);
    const email = `${username.toLowerCase().trim()}@trocas.app`;
    const passwordHash = await hashPassword(password);

    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('username', '==', username.trim().toLowerCase())
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      return { message: 'Este nome de usuário já está cadastrado.' };
    }

    const uid = crypto.randomUUID();
    await setDoc(doc(db, USUARIOS_COLLECTION, uid), {
      username: username.trim().toLowerCase(),
      email,
      name,
      password_hash: passwordHash,
      avatar_url: null,
      role: 'user',
      criado_em: new Date().toISOString(),
    });

    logger.info('authService', 'Conta criada com sucesso');
    return null;
  } catch (error) {
    logger.error('authService', 'Erro ao criar conta', error);
    return { message: 'Erro ao criar conta. Tente novamente.' };
  }
};

export const signOut = async (): Promise<void> => {
  localStorage.removeItem(SESSION_KEY);
  logger.info('authService', 'Logout realizado');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    const { user, timestamp } = JSON.parse(session);
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('username', '==', user.username)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const userData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      username: userData.username as string,
      email: userData.email as string || '',
      name: userData.name as string || null,
      avatar_url: userData.avatar_url as string || null,
      role: userData.role as 'admin' | 'user',
      criado_em: userData.criado_em as string || new Date().toISOString(),
    };
  } catch (error) {
    logger.error('authService', 'Erro ao verificar sessão', error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export interface AuthError {
  message: string;
}
