import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTrocasHistory } from '../../dashboard/services/trocasService';
import { formatBRL } from '../../../shared/utils/formatters';
import { SkeletonKPI } from '../../../shared/components/Skeleton';
import { Error } from '../../../shared/components/Error';
import { Header } from '../../../shared/components/Header';
import { logger } from '../../../shared/utils/logger';
import type { TrocasData } from '../../../shared/types/trocas';
import './History.css';

const PAGE_SIZE = 30;

const EmptyHistoryIcon = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
  </svg>
);

const SkeletonCard = (): JSX.Element => (
  <div className="history-item skeleton-item">
    <div className="item-header">
      <div className="skeleton-box" style={{ width: 80, height: 40 }} />
      <div className="skeleton-box" style={{ width: 70, height: 24, borderRadius: 20 }} />
    </div>
    <div className="item-values">
      <div className="value-col">
        <div className="skeleton-box" style={{ width: 60, height: 14, marginBottom: 4 }} />
        <div className="skeleton-box" style={{ width: 100, height: 20 }} />
      </div>
      <div className="value-divider" />
      <div className="value-col">
        <div className="skeleton-box" style={{ width: 60, height: 14, marginBottom: 4 }} />
        <div className="skeleton-box" style={{ width: 100, height: 20 }} />
      </div>
      <div className="value-divider" />
      <div className="value-col">
        <div className="skeleton-box" style={{ width: 60, height: 14, marginBottom: 4 }} />
        <div className="skeleton-box" style={{ width: 100, height: 20 }} />
      </div>
    </div>
  </div>
);

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<TrocasData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadHistory = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setHasMore(true);

    try {
      const data = await getTrocasHistory(PAGE_SIZE);
      setHistory(data);
      setHasMore(data.length >= PAGE_SIZE);
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

  const loadMore = useCallback(async (): Promise<void> => {
    if (!user || history.length === 0) return;
    setLoadingMore(true);
    try {
      const lastDate = history[history.length - 1].data;
      const data = await getTrocasHistory(PAGE_SIZE, lastDate);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setHistory((prev) => [...prev, ...data]);
        setHasMore(data.length >= PAGE_SIZE);
      }
    } catch (err) {
      logger.error('History', 'Erro ao carregar mais', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, history]);

  const handleViewDay = useCallback((date: string): void => {
    navigate(`/dashboard/${date}`);
  }, [navigate]);

  const resumo = useMemo(() => {
    if (history.length === 0) return null;
    const totalRealizado = history.reduce((sum, h) => sum + h.total_realizado, 0);
    const totalMeta = history.reduce((sum, h) => sum + h.total_meta, 0);
    const totalDiferenca = totalRealizado - totalMeta;
    const pctMedio = totalMeta > 0 ? ((totalRealizado - totalMeta) / totalMeta) * 100 : 0;
    return { totalRealizado, totalMeta, totalDiferenca, pctMedio, dias: history.length };
  }, [history]);

  const groupedHistory = useMemo(() => {
    const groups: { key: string; label: string; items: TrocasData[] }[] = [];
    let currentGroup: { key: string; label: string; items: TrocasData[] } | null = null;

    for (const item of history) {
      const d = new Date(item.data + 'T00:00:00');
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${d.toLocaleDateString('pt-BR', { month: 'long' })} de ${d.getFullYear()}`;

      if (!currentGroup || currentGroup.key !== key) {
        currentGroup = { key, label, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }
    return groups;
  }, [history]);

  if (loading) {
    return (
      <div className="history-page">
        <Header title="HISTÓRICO DE TROCAS" />
        <div className="history-summary">
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
        </div>
        <section className="history-list">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
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
          <EmptyHistoryIcon />
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
              <div className={`summary-card ${resumo.pctMedio > 0 ? 'summary-negative' : resumo.pctMedio < 0 ? 'summary-positive' : ''}`}>
                <span className="summary-label">Atingimento médio</span>
                <span className="summary-value">
                  {Math.abs(resumo.pctMedio).toFixed(2).replace('.', ',')}%
                  <span className="summary-arrow">
                    {resumo.pctMedio > 0 ? ' ↑' : resumo.pctMedio < 0 ? ' ↓' : ' →'}
                  </span>
                </span>
              </div>
            </section>
          )}

          <section className="history-list">
            {groupedHistory.map((group) => (
              <div key={group.key}>
                <div className="month-separator">
                  <span className="month-label">{group.label}</span>
                  <span className="month-count">{group.items.length} dia(s)</span>
                </div>

                {group.items.map((item) => {
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
                            <span className="date-month">
                              {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                            </span>
                            <span className="date-year">{new Date(item.data + 'T00:00:00').getFullYear()}</span>
                          </div>
                        </div>
                        <div className={`item-status ${isAcima ? 'status-acima' : isAbaixo ? 'status-abaixo' : 'status-ok'}`}>
                          {isAcima ? '↑ Acima' : isAbaixo ? '↓ Abaixo' : '→ Na meta'}
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
                        <span className="item-sectors">
                          {item.setores.slice(0, 3).map((s) => s.categoria).join(', ')}
                          {item.setores.length > 3 && ` +${item.setores.length - 3}`}
                        </span>
                        <span className="item-arrow">→</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}

            {hasMore && (
              <div className="load-more-wrap">
                <button
                  className="btn-primary"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Carregando...' : `Carregar mais`}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default History;