import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTrocasHistory } from '../../dashboard/services/trocasService';
import { formatarDataDiaMesAno, formatBRL } from '../../../shared/utils/formatters';
import { Loading } from '../../../shared/components/Loading';
import { Error } from '../../../shared/components/Error';
import { Header } from '../../../shared/components/Header';
import { logger } from '../../../shared/utils/logger';
import type { TrocasData } from '../../../shared/types/trocas';
import './History.css';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<TrocasData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTrocasHistory(30);
      setHistory(data);
    } catch (err) {
      setError('Erro ao carregar histórico');
      logger.error('History', 'Erro ao carregar histórico', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleViewDay = useCallback((date: string): void => {
    navigate(`/dashboard/${date}`);
  }, [navigate]);

  const resumo = useMemo(() => {
    if (history.length === 0) return null;
    const totalRealizado = history.reduce((sum, h) => sum + h.total_realizado, 0);
    const totalMeta = history.reduce((sum, h) => sum + h.total_meta, 0);
    const totalDiferenca = totalRealizado - totalMeta;
    return { totalRealizado, totalMeta, totalDiferenca, dias: history.length };
  }, [history]);

  if (loading) {
    return (
      <div className="history-page">
        <Header title="HISTÓRICO DE TROCAS" />
        <div className="history-loading">
          <Loading message="Carregando histórico..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <Header title="HISTÓRICO DE TROCAS" />
        <Error message={error} onRetry={loadHistory} />
      </div>
    );
  }

  return (
    <div className="history-page">
      <Header title="HISTÓRICO DE TROCAS" />

      {history.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon">📋</div>
          <h2>Nenhum dado encontrado</h2>
          <p>Nenhum lançamento foi salvo ainda. Acesse o Dashboard para registrar valores.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Ir para Dashboard
          </button>
        </div>
      ) : (
        <>
          {resumo && (
            <section className="history-summary">
              <div className="summary-card">
                <span className="summary-label">Dias com lançamentos</span>
                <span className="summary-value">{resumo.dias}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Total realizado</span>
                <span className="summary-value">{formatBRL(resumo.totalRealizado)}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Meta total</span>
                <span className="summary-value">{formatBRL(resumo.totalMeta)}</span>
              </div>
              <div className={`summary-card ${resumo.totalDiferenca > 0 ? 'summary-negative' : 'summary-positive'}`}>
                <span className="summary-label">Diferença total</span>
                <span className="summary-value">{formatBRL(resumo.totalDiferenca)}</span>
              </div>
            </section>
          )}

          <section className="history-list">
            {history.map((item) => {
              const isAcima = item.total_diferenca > 0;
              const isAbaixo = item.total_diferenca < 0;

              return (
                <article
                  key={item.id}
                  className="history-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewDay(item.data)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDay(item.data); }}
                >
                  <div className="item-header">
                    <div className="item-date">
                      <span className="date-day">{new Date(item.data + 'T00:00:00').getDate()}</span>
                      <div className="date-meta">
                        <span className="date-month">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="date-year">{new Date(item.data + 'T00:00:00').getFullYear()}</span>
                      </div>
                    </div>
                    <div className={`item-status ${isAcima ? 'status-acima' : isAbaixo ? 'status-abaixo' : 'status-ok'}`}>
                      {isAcima ? '↑ Acima' : isAbaixo ? '↓ Abaixo' : '→ No alvo'}
                    </div>
                  </div>

                  <div className="item-values">
                    <div className="value-col">
                      <span className="value-label">Realizado</span>
                      <span className="value-amount">{formatBRL(item.total_realizado)}</span>
                    </div>
                    <div className="value-divider" />
                    <div className="value-col">
                      <span className="value-label">Meta</span>
                      <span className="value-amount">{formatBRL(item.total_meta)}</span>
                    </div>
                    <div className="value-divider" />
                    <div className={`value-col ${isAcima ? 'value-negative' : isAbaixo ? 'value-positive' : ''}`}>
                      <span className="value-label">Diferença</span>
                      <span className="value-amount">{formatBRL(item.total_diferenca)}</span>
                    </div>
                  </div>

                  <div className="item-footer">
                    <span className="item-sectors">{item.setores.length} setores</span>
                    <span className="item-arrow">→</span>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
};

export default History;
