import { useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useTrocas } from '../hooks/useTrocas';
import { useToast } from '../../../app/providers/ToastProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Header } from '../../../shared/components/Header';
import { KPICard } from '../../../shared/components/KPICard';
import { DataTable } from '../../../shared/components/DataTable';
import { SkeletonKPI, SkeletonTable } from '../../../shared/components/Skeleton';
import { IconTotal, IconMeta, IconDiferenca } from '../../../shared/components/Icons';
import type { TableColumn, KPIData } from '../../../shared/types/trocas';
import { formatBRL, formatarStatusMetaTotal, formatarDiferenca } from '../../../shared/utils/formatters';
import './Dashboard.css';

const COLUMNS: TableColumn[] = [
  { key: 'categoria', header: 'SETOR', sortable: true, align: 'left' },
  { key: 'realizado', header: 'REALIZADO', sortable: true, align: 'right' },
  { key: 'meta', header: 'META', sortable: true, align: 'right' },
  { key: 'diferenca', header: 'DIFERENÇA', sortable: true, align: 'right' },
  { key: 'status', header: 'STATUS', sortable: true, align: 'right' },
];

export const Dashboard: React.FC = () => {
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

    const totalRealizado = setoresAtuais.reduce((sum, s) => sum + s.realizado, 0);
    const totalMeta = setoresAtuais.reduce((sum, s) => sum + s.meta, 0);
    const totalDiferenca = totalRealizado - totalMeta;

    return [
      {
        label: 'TOTAL REALIZADO',
        value: totalRealizado,
        formattedValue: formatBRL(totalRealizado),
        icon: <IconTotal />,
        tooltip: 'Soma de todos os valores realizados no período',
      },
      {
        label: 'META TOTAL',
        value: totalMeta,
        formattedValue: formatBRL(totalMeta),
        icon: <IconMeta />,
        tooltip: 'Soma de todas as metas do período',
      },
      {
        label: 'DIFERENÇA TOTAL',
        value: totalDiferenca,
        formattedValue: formatarDiferenca(totalDiferenca),
        subValue: formatarStatusMetaTotal(totalRealizado, totalMeta),
        icon: <IconDiferenca />,
        tooltip: 'Diferença entre realizado e meta',
        status: totalDiferenca > 0 ? 'negativo' : 'positivo',
      },
    ];
  }, [setoresAtuais]);

  const handleEdit = useCallback(
    (id: string, field: 'realizado' | 'meta', value: number): void => {
      updateSetor(id, field, value);
    },
    [updateSetor]
  );

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      const success = await saveAll();
      if (success) {
        addToast('Dados salvos com sucesso!', 'success');
      } else {
        addToast('Erro ao salvar dados', 'error');
      }
    } catch {
      addToast('Erro ao salvar dados', 'error');
    } finally {
      setSaving(false);
    }
  }, [saveAll, addToast]);

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
          <div className="card tabela-card">
            <h2>DETALHAMENTO POR SETOR</h2>
            <SkeletonTable />
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
    <div className="dashboard" ref={dashboardRef}>
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
          <div className="card tabela-card">
            <h2>DETALHAMENTO POR SETOR</h2>
            <DataTable
              data={setoresAtuais}
              columns={COLUMNS}
              onEdit={handleEdit}
              melhorSetor={melhor}
              setorCritico={critico}
              readonly={user?.role !== 'admin'}
            />
          </div>
        </section>
      ) : (
        <section className="content-grid">
          <div className="card empty-state">
            <p>Nenhum departamento cadastrado.</p>
            <p className="empty-sub">Cadastre departamentos e metas para começar a usar o dashboard.</p>
            {user?.role === 'admin' ? (
              <Link to="/departamentos" className="btn-primary">
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
