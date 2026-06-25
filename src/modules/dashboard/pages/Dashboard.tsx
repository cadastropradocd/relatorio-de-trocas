import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useTrocas } from '../hooks/useTrocas';
import { useToast } from '../../../app/providers/ToastProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Header } from '../../../shared/components/Header';
import { KPICard } from '../../../shared/components/KPICard';
import { DepartmentCard } from '../../../shared/components/DepartmentCard';
import { SkeletonKPI } from '../../../shared/components/Skeleton';
import { IconTotal, IconMeta, IconDiferenca } from '../../../shared/components/Icons';
import { usePullToRefresh } from '../../../shared/hooks/usePullToRefresh';
import type { KPIData } from '../../../shared/types/trocas';
import { formatBRL, formatarStatusMetaTotal, formatarDiferenca, getStatusFromDifference } from '../../../shared/utils/formatters';
import { calculateTotals } from '../../../shared/utils/calculations';
import './Dashboard.css';

type SortMode = 'default' | 'name' | 'diferenca' | 'atingimento';

export const Dashboard = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const DEFAULT_DATE = new Date().toISOString().split('T')[0];
  const { date = DEFAULT_DATE } = useParams<{ date: string }>();

  const {
    trocas,
    departamentos,
    loading,
    error,
    hasChanges,
    updateSetor,
    saveAll,
    refresh,
  } = useTrocas(date);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [editCount, setEditCount] = useState<number>(0);

  const { pullDistance, isRefreshing } = usePullToRefresh(
    dashboardRef as React.RefObject<HTMLDivElement | null>,
    refresh,
    60,
    loading || isExporting
  );

  const setoresAtuais = trocas?.setores || departamentos;

  const { melhor, critico } = useMemo(() => {
    if (setoresAtuais.length === 0) {
      return { melhor: null, critico: null };
    }

    const sorted = [...setoresAtuais].sort((a, b) => a.percentual - b.percentual);

    return {
      melhor: sorted[0]?.categoria || null,
      critico: sorted[sorted.length - 1]?.categoria || null,
    };
  }, [setoresAtuais]);

  const kpis = useMemo<KPIData[]>(() => {
    if (setoresAtuais.length === 0) {
      return [
        { label: 'TOTAL REALIZADO', value: 0, formattedValue: formatBRL(0), icon: <IconTotal />, tooltip: 'Soma de todos os valores realizados no período' },
        { label: 'META TOTAL', value: 0, formattedValue: formatBRL(0), icon: <IconMeta />, tooltip: 'Soma de todas as metas do período' },
        { label: 'DIFERENÇA TOTAL', value: 0, formattedValue: 'R$ 0,00', subValue: '0,00% na meta total', icon: <IconDiferenca />, tooltip: 'Diferença entre realizado e meta' },
      ];
    }

    const { total_realizado, total_meta, total_diferenca } = calculateTotals(setoresAtuais);

    return [
      {
        label: 'TOTAL REALIZADO',
        value: total_realizado,
        formattedValue: formatBRL(total_realizado),
        icon: <IconTotal />,
        tooltip: 'Soma de todos os valores realizados no período',
      },
      {
        label: 'META TOTAL',
        value: total_meta,
        formattedValue: formatBRL(total_meta),
        icon: <IconMeta />,
        tooltip: 'Soma de todas as metas do período',
      },
      {
        label: 'DIFERENÇA TOTAL',
        value: total_diferenca,
        formattedValue: formatarDiferenca(total_diferenca),
        subValue: formatarStatusMetaTotal(total_realizado, total_meta),
        icon: <IconDiferenca />,
        tooltip: 'Diferença entre realizado e meta',
        status: getStatusFromDifference(total_diferenca),
      },
    ];
  }, [setoresAtuais]);

  const handleEdit = useCallback(
    (id: string, field: 'realizado' | 'meta', value: number): void => {
      updateSetor(id, field, value);
      setEditCount((prev) => prev + 1);
    },
    [updateSetor]
  );

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      const success = await saveAll();
      if (success) {
        addToast('Dados salvos com sucesso!', 'success');
        setEditCount(0);
      } else {
        addToast('Erro ao salvar dados', 'error');
      }
    } catch {
      addToast('Erro ao salvar dados', 'error');
    } finally {
      setSaving(false);
    }
  }, [saveAll, addToast]);

  // Confirmação ao sair com alterações pendentes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent): void => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  // Atalho Ctrl+S para salvar
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasChanges, saving, handleSave]);

  // Setores ordenados
  const sortedSetores = useMemo(() => {
    const list = [...setoresAtuais];
    switch (sortMode) {
      case 'name':
        return list.sort((a, b) => a.categoria.localeCompare(b.categoria));
      case 'diferenca':
        return list.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
      case 'atingimento':
        return list.sort((a, b) => b.percentual - a.percentual);
      default:
        return list;
    }
  }, [setoresAtuais, sortMode]);

  const handleExport = useCallback(async (): Promise<void> => {
    if (!dashboardRef.current) return;

    setIsExporting(true);

    try {
      const container = dashboardRef.current;
      const savedHeight = container.style.height;

      container.style.height = 'auto';

      const rodape = document.createElement('div');
      rodape.className = 'rodape-exportacao';
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      rodape.textContent = `Gerado em ${date.replace(/-/g, '/')} às ${timeStr}`;
      container.appendChild(rodape);

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const dataUrl = await toPng(container, {
        backgroundColor: '#0b1525',
        pixelRatio: Math.max(2, window.devicePixelRatio || 1),
      });

      container.removeChild(rodape);
      container.style.height = savedHeight;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `relatorio-trocas-${date}.png`;
      link.click();

      addToast('Imagem salva com sucesso!', 'success');
    } catch {
      addToast('Erro ao exportar imagem', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [date, addToast]);

  if (loading) {
    return (
      <div className="dashboard">
        <Header title="RELATÓRIO DE TROCAS DIÁRIO" date={date} />
        <section className="kpis">
          <SkeletonKPI />
          <SkeletonKPI />
          <SkeletonKPI />
        </section>
        <section className="content-grid">
          <div className="section-header">
            <h2 className="section-title">DETALHAMENTO POR SETOR</h2>
          </div>
          <div className="department-grid skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    const isNoDepartments = error.includes('departamento');
    return (
      <div className="dashboard">
        <div className="card empty-state" style={{ marginTop: '4rem' }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Atenção</h2>
          <p>{error}</p>
          {isNoDepartments && user?.role === 'admin' ? (
            <Link to="/departamentos" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Cadastrar departamentos
            </Link>
          ) : (
            <button onClick={refresh} className="btn-primary" style={{ marginTop: '1rem' }}>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" ref={dashboardRef} style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined }}>
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="pull-indicator" style={{ opacity: Math.min(pullDistance / 60, 1) }}>
          {isRefreshing ? (
            <div className="pull-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`pull-arrow ${pullDistance >= 60 ? 'pull-ready' : ''}`}
              style={{ transform: `rotate(${Math.min(pullDistance / 60, 1) * 180}deg)` }}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          )}
          <span>{isRefreshing ? 'Atualizando...' : 'Solte para atualizar'}</span>
        </div>
      )}
      <Header
        title="RELATÓRIO DE TROCAS DIÁRIO"
        onExport={handleExport}
        onSave={handleSave}
        hasChanges={hasChanges}
        saving={saving}
        date={date}
      />

      <section className="kpis">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} data={kpi} animate />
        ))}
      </section>

      {setoresAtuais.length > 0 ? (
        <section className="content-grid">
          {hasChanges && (
            <div className="unsaved-banner">
              <span className="unsaved-dot" />
              Alterações não salvas
              {editCount > 0 && <span className="edit-count">{editCount}</span>}
            </div>
          )}
          <div className="section-header">
            <h2 className="section-title">DETALHAMENTO POR SETOR</h2>
            <div className="sort-controls">
              <button className={`sort-btn ${sortMode === 'default' ? 'active' : ''}`} onClick={() => setSortMode('default')}>Padrão</button>
              <button className={`sort-btn ${sortMode === 'name' ? 'active' : ''}`} onClick={() => setSortMode('name')}>A-Z</button>
              <button className={`sort-btn ${sortMode === 'diferenca' ? 'active' : ''}`} onClick={() => setSortMode('diferenca')}>Diferença</button>
              <button className={`sort-btn ${sortMode === 'atingimento' ? 'active' : ''}`} onClick={() => setSortMode('atingimento')}>Atingimento</button>
            </div>
          </div>
          <div className="department-grid">
            {sortedSetores.map((setor) => (
              <DepartmentCard
                key={setor.id}
                setor={setor}
                isMelhor={setor.categoria === melhor}
                isCritico={setor.categoria === critico}
                readonly={user?.role !== 'admin'}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="content-grid">
          <div className="card empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <p>Nenhum departamento cadastrado</p>
            <p className="empty-sub">Cadastre departamentos e metas para começar a usar o dashboard.</p>
            {user?.role === 'admin' ? (
              <Link to="/departamentos" className="btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Cadastrar departamentos
              </Link>
            ) : (
              <p className="empty-hint">Peça para um administrador cadastrar os departamentos.</p>
            )}
          </div>
        </section>
      )}

      {isExporting && (
        <div className="export-loading" role="status" aria-live="polite">
          <div className="spinner-small" />
          <span>Gerando imagem...</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
