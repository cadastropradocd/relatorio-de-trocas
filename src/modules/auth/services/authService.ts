import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../shared/services/firebase';
import type { User } from '../../../shared/types/trocas';
import { logger } from '../../../shared/utils/logger';

const USUARIOS_COLLECTION = 'usuarios';
const SESSION_KEY = 'trocas_session';
const SALT_LENGTH = 16;
const RATE_LIMIT_KEY = 'trocas_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

interface RateLimitData {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const getRateLimit = (username: string): RateLimitData => {
  const raw = localStorage.getItem(`${RATE_LIMIT_KEY}_${username}`);
  if (!raw) return { count: 0, firstAttempt: 0 };
  try {
    return JSON.parse(raw) as RateLimitData;
  } catch {
    return { count: 0, firstAttempt: 0 };
  }
};

const isLocked = (data: RateLimitData): boolean => {
  if (data.lockedUntil && Date.now() < data.lockedUntil) return true;
  if (data.count >= MAX_ATTEMPTS && Date.now() - data.firstAttempt < LOCKOUT_MS) return true;
  return false;
};

const recordAttempt = (username: string): void => {
  const current = getRateLimit(username);
  const now = Date.now();

  if (isLocked(current)) return;

  if (current.count === 0 || now - current.firstAttempt > LOCKOUT_MS) {
    const fresh: RateLimitData = { count: 1, firstAttempt: now };
    localStorage.setItem(`${RATE_LIMIT_KEY}_${username}`, JSON.stringify(fresh));
  } else {
    const updated: RateLimitData = {
      count: current.count + 1,
      firstAttempt: current.firstAttempt,
    };
    if (updated.count >= MAX_ATTEMPTS) {
      updated.lockedUntil = now + LOCKOUT_MS;
    }
    localStorage.setItem(`${RATE_LIMIT_KEY}_${username}`, JSON.stringify(updated));
  }
};

const clearAttempts = (username: string): void => {
  localStorage.removeItem(`${RATE_LIMIT_KEY}_${username}`);
};

const getRemainingLockoutMs = (data: RateLimitData): number => {
  if (data.lockedUntil) return Math.max(0, data.lockedUntil - Date.now());
  if (data.count >= MAX_ATTEMPTS) {
    return Math.max(0, data.firstAttempt + LOCKOUT_MS - Date.now());
  }
  return 0;
};

const generateSalt = (): string => {
  const array = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const hashPassword = async (password: string, salt?: string): Promise<string> => {
  const encoder = new TextEncoder();
  const saltedPassword = salt ? salt + password : password;
  const data = encoder.encode(saltedPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const migrateLegacyHash = async (userDoc: { id: string; data(): Record<string, unknown> }, password: string): Promise<string | null> => {
  try {
    const newSalt = generateSalt();
    const newHash = await hashPassword(password, newSalt);

    await updateDoc(doc(db, USUARIOS_COLLECTION, userDoc.id), {
      password_hash: newHash,
      salt: newSalt,
    });

    logger.info('authService', 'Hash migrado com salt para usuário', { userId: userDoc.id });
    return newHash;
  } catch (error) {
    logger.error('authService', 'Falha ao migrar hash legado', error);
    return null;
  }
};

export const signIn = async (username: string, password: string): Promise<AuthError | null> => {
  try {
    logger.info('authService', `Tentando login: ${username}`);

    const normalizedUsername = username.trim().toLowerCase();

    const rateData = getRateLimit(normalizedUsername);
    if (isLocked(rateData)) {
      const remaining = Math.ceil(getRemainingLockoutMs(rateData) / 60000);
      logger.warn('authService', 'Login bloqueado por rate limiting', { username: normalizedUsername });
      return { message: `Conta temporariamente bloqueada. Tente novamente em ${remaining} minuto(s).` };
    }

    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('username', '==', normalizedUsername)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      recordAttempt(normalizedUsername);
      logger.warn('authService', 'Usuário não encontrado');
      return { message: 'Usuário ou senha incorretos.' };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const storedHash = userData.password_hash as string;
    const storedSalt = userData.salt as string | undefined;

    if (!storedHash) {
      logger.error('authService', 'Usuário sem senha_hash');
      return { message: 'Erro ao autenticar. Tente novamente.' };
    }

    const inputHash = storedSalt
      ? await hashPassword(password, storedSalt)
      : await hashPassword(password);

    if (inputHash !== storedHash) {
      recordAttempt(normalizedUsername);
      logger.warn('authService', 'Senha incorreta');
      return { message: 'Usuário ou senha incorretos.' };
    }

    clearAttempts(normalizedUsername);

    if (!storedSalt) {
      logger.info('authService', 'Usuário sem salt, migrando...');
      const migratedHash = await migrateLegacyHash(userDoc, password);
      if (!migratedHash) {
        logger.warn('authService', 'Migração falhou, mantendo hash legado');
      }
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
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

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
      salt,
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
    const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;
    if (Date.now() - timestamp > SESSION_MAX_AGE) {
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
