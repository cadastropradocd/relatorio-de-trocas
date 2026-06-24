import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { getAllUsers, createUser, updateUser, deleteUser, migrateExistingUsers } from '../services/userService';
import { ConfirmModal } from '../../../shared/components/Modal';
import { Loading } from '../../../shared/components/Loading';
import { Error } from '../../../shared/components/Error';
import { formatarDataDiaMesAno } from '../../../shared/utils/formatters';
import { logger } from '../../../shared/utils/logger';
import type { User } from '../../../shared/types/trocas';
import './Users.css';

type ModalMode = 'create' | 'edit' | null;

interface FormData {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

const EMPTY_FORM: FormData = { name: '', username: '', password: '', role: 'user' };

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const loadUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setLoadError('Erro ao carregar usuários');
      logger.error('Users', 'Erro ao carregar usuários', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = useCallback((): void => {
    setForm(EMPTY_FORM);
    setEditingUser(null);
    setModalMode('create');
  }, []);

  const openEdit = useCallback((u: User): void => {
    setForm({ name: u.name || '', username: u.username, password: '', role: u.role });
    setEditingUser(u);
    setModalMode('edit');
  }, []);

  const closeModal = useCallback((): void => {
    setModalMode(null);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        if (!form.username.trim()) {
          addToast('Informe um nome de usuário', 'error');
          setSubmitting(false);
          return;
        }
        if (!form.password || form.password.length < 6) {
          addToast('A senha deve ter pelo menos 6 caracteres', 'error');
          setSubmitting(false);
          return;
        }
        await createUser({ username: form.username.trim(), password: form.password, name: form.name, role: form.role });
        addToast('Usuário criado com sucesso!', 'success');

        navigate('/login');
        addToast('Faça login novamente para continuar.', 'info');
        return;
      } else if (modalMode === 'edit' && editingUser) {
        await updateUser(editingUser.id, { name: form.name, username: form.username.trim(), role: form.role });
        addToast('Usuário atualizado com sucesso!', 'success');
      }
      closeModal();
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar usuário';
      addToast(msg, 'error');
      logger.error('Users', msg, err);
    } finally {
      setSubmitting(false);
    }
  }, [modalMode, form, editingUser, addToast, closeModal, loadUsers, navigate]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      addToast('Usuário excluído com sucesso!', 'success');
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      addToast('Erro ao excluir usuário', 'error');
      logger.error('Users', 'Erro ao excluir usuário', err);
    }
  }, [deleteTarget, addToast, loadUsers]);

  const [migrating, setMigrating] = useState<boolean>(false);

  const handleMigrate = useCallback(async (): Promise<void> => {
    setMigrating(true);
    try {
      const result = await migrateExistingUsers();
      addToast(`Migração concluída: ${result.migrated} migrados, ${result.skipped} já tinham username`, 'success');
      await loadUsers();
    } catch (err) {
      addToast('Erro ao migrar usuários', 'error');
      logger.error('Users', 'Erro ao migrar usuários', err);
    } finally {
      setMigrating(false);
    }
  }, [addToast, loadUsers]);

  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return <Loading message="Carregando usuários..." />;
  }

  if (loadError) {
    return <Error message={loadError} onRetry={loadUsers} />;
  }

  return (
    <div className="users-page" style={{ animation: 'fadeInUp 0.4s ease' }}>
      <header className="users-header">
        <h1>
          <span className="title-bar" />
          GERENCIAMENTO DE USUÁRIOS
        </h1>
        <button className="btn-primary" onClick={openCreate}>
          + Novo Usuário
        </button>
        <button
          className="btn-secondary"
          onClick={handleMigrate}
          disabled={migrating}
          title="Adiciona campo username nos usuários existentes"
        >
          {migrating ? 'Migrando...' : 'Migrar Usuários'}
        </button>
      </header>

      {users.length > 0 ? (
        <section className="users-grid-section">
          <div className="users-grid">
            {users.map((u) => (
              <div key={u.id} className="user-card">
                <div className="card-header">
                  <span className="card-username">@{u.username}</span>
                  <span className={`role-badge role-${u.role}`}>
                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </div>

                <div className="card-body">
                  <h3 className="card-nome">{u.name || '-'}</h3>
                  <div className="card-meta-label">Criado em</div>
                  <div className="card-meta">{formatarDataDiaMesAno(new Date(u.criado_em))}</div>
                </div>

                <div className="card-actions">
                  <button className="btn-action edit" onClick={() => openEdit(u)} title="Editar usuário">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                  <button className="btn-action delete" onClick={() => setDeleteTarget(u)} title="Excluir usuário">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="users-empty">
          <div className="card">
            <div className="empty-state-content">
              <p>Nenhum usuário encontrado</p>
            </div>
          </div>
        </section>
      )}

      {modalMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user-name">Nome</label>
                <input
                  type="text"
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do usuário"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-username">Usuário</label>
                <input
                  type="text"
                  id="user-username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Nome de usuário"
                  required
                />
              </div>

              {modalMode === 'create' && (
                <div className="form-group">
                  <label htmlFor="user-password">Senha</label>
                  <input
                    type="password"
                    id="user-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="user-role">Função</label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : modalMode === 'create' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${deleteTarget?.username || deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Users;
