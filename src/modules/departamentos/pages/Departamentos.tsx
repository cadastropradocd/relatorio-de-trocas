import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { getAllDepartamentos, createDepartamento, updateDepartamento, deleteDepartamento } from '../services/departamentoService';
import { seedDepartamentos } from '../services/seedDepartamentos';
import { logger } from '../../../shared/utils/logger';
import { formatBRL } from '../../../shared/utils/formatters';
import { ConfirmModal } from '../../../shared/components/Modal';
import { Loading } from '../../../shared/components/Loading';
import { Error } from '../../../shared/components/Error';
import type { Departamento } from '../../../shared/types/trocas';
import './Departamentos.css';

export const Departamentos: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState<string>('');
  const [formMeta, setFormMeta] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Departamento | null>(null);

  const loadDepartamentos = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAllDepartamentos();
      setDepartamentos(data);
      logger.info('Departamentos', `${data.length} departamentos carregados`);
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      const errorMsg = `Erro ao carregar departamentos: ${errorObj.message || String(err)} (${errorObj.code || 'unknown'})`;
      logger.error('Departamentos', errorMsg, err);
      setLoadError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartamentos();
  }, [loadDepartamentos]);

  const openCreate = useCallback((): void => {
    setEditingId(null);
    setFormNome('');
    setFormMeta('');
    setShowForm(true);
  }, []);

  const openEdit = useCallback((dep: Departamento): void => {
    setEditingId(dep.id);
    setFormNome(dep.nome);
    setFormMeta(String(dep.meta_mensal));
    setShowForm(true);
  }, []);

  const closeForm = useCallback((): void => {
    setShowForm(false);
    setEditingId(null);
    setFormNome('');
    setFormMeta('');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const nome = formNome.trim();
    const meta = parseFloat(formMeta.replace(/\./g, '').replace(',', '.'));

    if (!nome) {
      addToast('Informe o nome do departamento', 'error');
      return;
    }

    if (isNaN(meta) || meta < 0) {
      addToast('Informe uma meta válida', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDepartamento(editingId, { nome, meta_mensal: meta });
        addToast('Departamento atualizado!', 'success');
      } else {
        await createDepartamento(nome, meta);
        addToast('Departamento criado!', 'success');
      }
      closeForm();
      await loadDepartamentos();
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      const errorMsg = `Erro ao salvar: ${errorObj.message || String(err)}`;
      logger.error('Departamentos', errorMsg, err);
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editingId, formNome, formMeta, addToast, closeForm, loadDepartamentos]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await deleteDepartamento(deleteTarget.id);
      addToast('Departamento excluído!', 'success');
      setDeleteTarget(null);
      await loadDepartamentos();
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      const errorMsg = `Erro ao excluir: ${errorObj.message || String(err)}`;
      logger.error('Departamentos', errorMsg, err);
      addToast(errorMsg, 'error');
    }
  }, [deleteTarget, addToast, loadDepartamentos]);

  const handleToggleAtivo = useCallback(async (dep: Departamento): Promise<void> => {
    try {
      await updateDepartamento(dep.id, { ativo: !dep.ativo });
      addToast(dep.ativo ? 'Departamento desativado!' : 'Departamento ativado!', 'success');
      await loadDepartamentos();
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      const errorMsg = `Erro ao alterar status: ${errorObj.message || String(err)}`;
      logger.error('Departamentos', errorMsg, err);
      addToast(errorMsg, 'error');
    }
  }, [addToast, loadDepartamentos]);

  const handleSeedDefaults = useCallback(async (): Promise<void> => {
    logger.info('Departamentos', 'Botão Cadastrar padrão clicado');
    try {
      logger.info('Departamentos', 'Chamando seedDepartamentos...');
      const result = await seedDepartamentos();
      logger.info('Departamentos', `Seed retornou:`, result);
      addToast(`${result.created} departamentos padrão cadastrados!`, 'success');
      logger.info('Departamentos', 'Recarregando lista...');
      await loadDepartamentos();
    } catch (err) {
      const errorObj = err as { code?: string; message?: string };
      const errorMsg = `Erro ao cadastrar padrão: ${errorObj.message || String(err)} (${errorObj.code || 'unknown'})`;
      logger.error('Departamentos', errorMsg, err);
      addToast(errorMsg, 'error');
    }
  }, [addToast, loadDepartamentos]);

  if (!user || user.role !== 'admin') return null;

  if (loading) return <Loading message="Carregando departamentos..." />;
  if (loadError) return <Error message={loadError} onRetry={loadDepartamentos} />;

  return (
    <div className="departamentos-page" style={{ animation: 'fadeInUp 0.4s ease' }}>
      <header className="departamentos-header">
        <h1>
          <span className="title-bar" />
          DEPARTAMENTOS E METAS
        </h1>
        <button className="btn-primary" onClick={openCreate}>
          + Novo Departamento
        </button>
      </header>

      {departamentos.length > 0 ? (
        <section className="departamentos-grid-section">
          <div className="departamentos-grid">
            {departamentos.map((dep) => (
              <div key={dep.id} className={`departamento-card${!dep.ativo ? ' inactive' : ''}`}>
                <div className="card-header">
                  <span className="card-ordem">#{String(dep.ordem).padStart(2, '0')}</span>
                  <button
                    className={`status-toggle ${dep.ativo ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleAtivo(dep)}
                  >
                    {dep.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <div className="card-body">
                  <h3 className="card-nome">{dep.nome}</h3>
                  <div className="card-meta-label">Meta Mensal</div>
                  <div className="card-meta">{formatBRL(dep.meta_mensal)}</div>
                </div>

                <div className="card-actions">
                  <button className="btn-action edit" onClick={() => openEdit(dep)} title="Editar departamento">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                  <button className="btn-action delete" onClick={() => setDeleteTarget(dep)} title="Excluir departamento">
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
        <section className="departamentos-empty">
          <div className="card">
            <div className="empty-state-content">
              <p>Nenhum departamento cadastrado</p>
              <button className="btn-primary" onClick={handleSeedDefaults}>
                Cadastrar departamentos padrão
              </button>
            </div>
          </div>
        </section>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Editar Departamento' : 'Novo Departamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="dep-nome">Nome</label>
                <input
                  type="text"
                  id="dep-nome"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Nome do departamento"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dep-meta">Meta Mensal (R$)</label>
                <input
                  type="text"
                  id="dep-meta"
                  value={formMeta}
                  onChange={(e) => setFormMeta(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
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
        title="Excluir Departamento"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Departamentos;
