import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { User } from '../../shared/types/trocas';
import { getCurrentUser, onAuthStateChange, signIn as authSignIn, signOut as authSignOut, signUp as authSignUp } from '../services/authService';

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
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    const loadUser = async (): Promise<void> => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setSessionExpired(false);
      } else if (event === 'SIGNED_OUT') {
        setUser((prev) => {
          if (prev !== null) {
            setSessionExpired(true);
          }
          return null;
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<{ error?: string } | null> => {
    const error = await authSignIn(username, password);
    if (error) {
      return { error: error.message };
    }

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setSessionExpired(false);

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
      // User may need to confirm email
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

  return (
    <AuthContext.Provider value={value}>
      <SessionExpiredNotifier sessionExpired={sessionExpired} onHandled={() => setSessionExpired(false)} />
      {children}
    </AuthContext.Provider>
  );
};

const SessionExpiredNotifier: React.FC<{
  sessionExpired: boolean;
  onHandled: () => void;
}> = ({ sessionExpired, onHandled }) => {
  useEffect(() => {
    if (sessionExpired) {
      window.dispatchEvent(new CustomEvent('session-expired'));
      onHandled();
    }
  }, [sessionExpired, onHandled]);

  return null;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthProvider;
