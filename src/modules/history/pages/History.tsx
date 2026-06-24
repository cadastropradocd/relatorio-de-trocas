import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTrocasHistory } from '../../dashboard/services/trocasService';
import { formatBRL } from '../../../shared/utils/formatters';
import { Error } from '../../../shared/components/Error';
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
      <div className="value-row">
        <div className="skeleton-box" style={{ width: 60, height: 14 }} />
        <div className="skeleton-box" style={{ width: 100, height: 20 }} />
      </div>
      <div className="value-row">
        <div className="skeleton-box" style={{ width: 60, height: 14 }} />
        <div className="skeleton-box" style={{ width: 100, height: 20 }} />
      </div>
      <div className="value-row">
        <div className="skeleton-box" style={{ width: 60, height: 14 }} />
        <div className="skeleton-box" style={{ width: 100, height: 20 }} />
      </div>
    </div>
    <div className="item-footer">
      <div className="skeleton-box" style={{ width: 120, height: 14 }} />
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
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <div className="history-page" style={{ animation: 'fadeInUp 0.4s ease' }}>
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
      <div className="history-page" style={{ animation: 'fadeInUp 0.4s ease' }}>
        <Error message={error} onRetry={loadHistory} />
      </div>
    );
  }

  return (
    <div className="history-page" style={{ animation: 'fadeInUp 0.4s ease' }}>

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
          <section className="history-list">
            {groupedHistory.map((group) => (
              <div key={group.key}>
                <div className="month-separator">
                  <span className="month-label">{group.label}</span>
                  <span className="month-count">{group.items.length} dia(s)</span>
                </div>

                <div className="history-grid">
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
                        <div className="value-row">
                          <span className="value-label">Realizado</span>
                          <span className="value-amount">{formatBRL(item.total_realizado)}</span>
                        </div>
                        <div className="value-row">
                          <span className="value-label">Meta</span>
                          <span className="value-amount">{formatBRL(item.total_meta)}</span>
                        </div>
                        <div className={`value-row ${isAcima ? 'value-negative' : isAbaixo ? 'value-positive' : ''}`}>
                          <span className="value-label">Diferença</span>
                          <span className="value-amount">
                            {formatBRL(item.total_diferenca)}
                            <span className="value-arrow">{isAcima ? ' ↑' : isAbaixo ? ' ↓' : ''}</span>
                          </span>
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

          {showScrollTop && (
            <button
              className="scroll-top-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Voltar ao topo"
              title="Voltar ao topo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default History;