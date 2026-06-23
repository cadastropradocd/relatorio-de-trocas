import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { User } from '../../shared/types/trocas';
import { getCurrentUser, signIn as authSignIn, signOut as authSignOut, signUp as authSignUp } from '../../modules/auth/services/authService';
import { logger } from '../../shared/utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string } | null>;
  signUp: (username: string, password: string, name: string) => Promise<{ error?: string } | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async (): Promise<void> => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        logger.error('AuthProvider', 'Erro ao carregar usuário', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<{ error?: string } | null> => {
    const error = await authSignIn(username, password);
    if (error) {
      return { error: error.message };
    }

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    return null;
  }, []);

  const signUp = useCallback(async (username: string, password: string, name: string): Promise<{ error?: string } | null> => {
    const error = await authSignUp(username, password, name);
    if (error) {
      return { error: error.message };
    }

    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch {
      // Ignorar
    }

    return null;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }), [user, loading, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthProvider;
