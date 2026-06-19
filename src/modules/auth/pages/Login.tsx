import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import './Login.css';

const validateUsername = (u: string): string | null => {
  if (!u.trim()) return 'Nome de usuário é obrigatório';
  if (u.trim().length < 3) return 'Nome de usuário deve ter pelo menos 3 caracteres';
  if (!/^[a-zA-Z0-9_]+$/.test(u.trim())) return 'Nome de usuário deve conter apenas letras, números e _';
  return null;
};

const validatePassword = (p: string): string | null => {
  if (!p) return 'Senha é obrigatória';
  if (p.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
  return null;
};

export const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string | null; password?: string | null; name?: string | null }>({});

  const { user, signIn, signUp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const state = location.state as { from?: { pathname: string } } | null;
      const from = state?.from?.pathname || '/';
      navigate(from);
    }
  }, [user, navigate, location]);

  const validateFields = useCallback((): boolean => {
    const errors: typeof fieldErrors = {};
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError) errors.username = usernameError;
    if (passwordError) errors.password = passwordError;
    if (isSignUp && !name.trim()) errors.name = 'Nome é obrigatório';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, password, name, isSignUp]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateFields()) return;

    setIsLoading(true);

    try {
       if (isSignUp) {
         const result = await signUp(username, password, name);
         if (result?.error) {
           addToast(result.error, 'error');
           setError(result.error);
         } else {
           const msg = 'Conta criada com sucesso! Agora faça login.';
           setSuccessMessage(msg);
           addToast(msg, 'success');
           setIsSignUp(false);
         }
       } else {
         const result = await signIn(username, password);
         if (result?.error) {
           addToast(result.error, 'error');
           setError(result.error);
         }
       }
    } catch {
      addToast('Ocorreu um erro. Tente novamente.', 'error');
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = useCallback((): void => {
    setIsSignUp((prev) => !prev);
    setError(null);
    setSuccessMessage(null);
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isSignUp ? 'Criar Conta' : 'Entrar'}</h1>
          <p>Gerencie suas trocas diárias de forma simples e eficiente</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {successMessage && (
          <div className="login-success">
            <span>✅</span> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: null })); }}
                placeholder="Seu nome"
                required
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFieldErrors((prev) => ({ ...prev, username: null })); }}
              placeholder="Nome de usuário"
              required
              autoComplete="username"
            />
            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: null })); }}
              placeholder={isSignUp ? "Crie uma senha forte" : "Sua senha"}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password || (isSignUp && !name.trim())}
            className="login-btn"
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                Carregando...
              </>
            ) : isSignUp ? (
              'Criar Conta'
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button type="button" className="toggle-btn" onClick={toggleMode}>
              {isSignUp ? 'Entrar' : 'Criar Conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
