import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as firebaseDeleteUser,
} from 'firebase/auth';
import { auth, db } from '../../../shared/services/firebase';
import type { User } from '../../../shared/types/trocas';
import { usernameToEmail, convertFirestoreTimestamp } from '../../../shared/utils/auth';
import { logger } from '../../../shared/utils/logger';

export interface CreateUserData {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  role?: 'admin' | 'user';
}

const USUARIOS_COLLECTION = 'usuarios';

const docToUser = (docSnap: { id: string; data(): Record<string, unknown> }): User => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    username: (data.username as string) || '',
    email: (data.email as string) || '',
    name: (data.name as string) || null,
    avatar_url: (data.avatar_url as string) || null,
    role: (data.role as 'admin' | 'user') || 'user',
    criado_em: convertFirestoreTimestamp(data.criado_em),
  };
};

export const getAllUsers = async (limitCount: number = 100): Promise<User[]> => {
  try {
    logger.debug('userService', 'Buscando todos os usuarios');
    const q = query(collection(db, USUARIOS_COLLECTION), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);
    logger.debug('userService', `${snapshot.size} usuarios encontrados`);
    return snapshot.docs.map(docToUser);
  } catch (error) {
    logger.error('userService', 'Erro ao buscar usuarios', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    logger.debug('userService', `Buscando usuario por ID: ${userId}`);
    const docSnap = await getDoc(doc(db, USUARIOS_COLLECTION, userId));
    if (!docSnap.exists()) return null;
    return docToUser(docSnap);
  } catch (error) {
    logger.error('userService', 'Erro ao buscar usuario por ID', error);
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    logger.debug('userService', `Buscando usuario por username: ${username}`);
    const q = query(
      collection(db, USUARIOS_COLLECTION),
      where('username', '==', username)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return docToUser(snapshot.docs[0]);
  } catch (error) {
    logger.error('userService', 'Erro ao buscar usuario por username', error);
    throw error;
  }
};

export const createUser = async (data: CreateUserData): Promise<User | null> => {
  try {
    logger.info('userService', `Criando usuario: ${data.username}`);
    const email = usernameToEmail(data.username);
    const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: data.name });

    const userData = {
      username: data.username,
      email,
      name: data.name,
      avatar_url: null,
      role: data.role,
      criado_em: serverTimestamp(),
    };

    await setDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid), userData);

    logger.info('userService', 'Usuario criado com sucesso');

    return {
      id: firebaseUser.uid,
      username: data.username,
      email,
      name: data.name,
      avatar_url: null,
      role: data.role,
      criado_em: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('userService', 'Erro ao criar usuario', error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: UpdateUserData): Promise<void> => {
  try {
    logger.info('userService', `Atualizando usuario: ${userId}`);
    const updates: Record<string, string> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.username !== undefined) {
      updates.username = data.username;
      updates.email = usernameToEmail(data.username);
    }
    if (data.role !== undefined) updates.role = data.role;

    if (Object.keys(updates).length > 0) {
      await setDoc(doc(db, USUARIOS_COLLECTION, userId), updates, { merge: true });
    }

    logger.info('userService', 'Usuario atualizado com sucesso');
  } catch (error) {
    logger.error('userService', 'Erro ao atualizar usuario', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    logger.info('userService', `Deletando usuario: ${userId}`);
    await deleteDoc(doc(db, USUARIOS_COLLECTION, userId));
    const firebaseUser = await auth.currentUser;
    if (firebaseUser && firebaseUser.uid === userId) {
      await firebaseDeleteUser(firebaseUser);
    }
    logger.info('userService', 'Usuario deletado com sucesso');
  } catch (error) {
    logger.error('userService', 'Erro ao deletar usuario', error);
    throw error;
  }
};

export const migrateExistingUsers = async (): Promise<{ migrated: number; skipped: number }> => {
  try {
    logger.info('userService', 'Iniciando migracao de usuarios existentes');
    const snapshot = await getDocs(collection(db, USUARIOS_COLLECTION));
    let migrated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.username) {
        skipped++;
        continue;
      }

      const email = (data.email as string) || '';
      const username = email.split('@')[0] || '';

      if (username) {
        await setDoc(doc(db, USUARIOS_COLLECTION, docSnap.id), {
          username,
          email,
        }, { merge: true });
        migrated++;
      }
    }

    logger.info('userService', 'Migracao concluida', { migrated, skipped });
    return { migrated, skipped };
  } catch (error) {
    logger.error('userService', 'Erro na migracao de usuarios', error);
    throw error;
  }
};
