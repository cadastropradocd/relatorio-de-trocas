import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTrocasByDateRange } from '../../dashboard/services/trocasService';
import { getAllDepartamentos } from '../../departamentos/services/departamentoService';
import { BarChart } from '../../../shared/components/Chart';
import { IconTotal, IconMeta, IconDiferenca, IconAtingimento } from '../../../shared/components/Icons';
import { SkeletonKPI } from '../../../shared/components/Skeleton';
import { formatBRL, formatarDataDiaMesAno } from '../../../shared/utils/formatters';
import { calculateTotals } from '../../../shared/utils/calculations';
import { logger } from '../../../shared/utils/logger';
import type { TrocasData, KPIData, Departamento } from '../../../shared/types/trocas';
import './Reports.css';

// Ícones para os grupos de filtros
const IconPeriodo = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconDepartamento = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.612L3.842 16.112l-1.32 3.962a.5.5 0 0 0 .623.622l3.962-1.32L21.174 10.797a1 1 0 0 0 0-1.323v-.001z" />
  </svg>
);

type PresetKey = '7d' | '30d' | 'month' | 'prev-month' | 'custom';

interface Preset {
  key: PresetKey;
  label: string;
}

const PRESETS: Preset[] = [
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: 'month', label: 'Mês atual' },
  { key: 'prev-month', label: 'Mês anterior' },
  { key: 'custom', label: 'Personalizado' },
];

const PRESET_TOOLTIPS: Record<PresetKey, string> = {
  '7d': 'Exibe os últimos 7 dias a partir de hoje',
  '30d': 'Exibe os últimos 30 dias a partir de hoje',
  'month': 'Exibe todos os dias do mês atual',
  'prev-month': 'Exibe todos os dias do mês anterior',
  'custom': 'Selecione um período personalizado',
};

const toDateStr = (d: Date): string => d.toISOString().split('T')[0];

const calcPresetRange = (preset: PresetKey): { start: string; end: string } => {
  const today = new Date();
  switch (preset) {
    case '7d': {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return { start: toDateStr(start), end: toDateStr(today) };
    }
    case '30d': {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return { start: toDateStr(start), end: toDateStr(today) };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toDateStr(start), end: toDateStr(today) };
    }
    case 'prev-month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    default:
      return { start: '', end: '' };
  }
};

const EmptyChartIcon = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l2 2" opacity="0.4" />
  </svg>
);

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<TrocasData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [activePreset, setActivePreset] = useState<PresetKey>('30d');
  const defaultRange = calcPresetRange('30d');
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);

  const isDateRangeValid = startDate <= endDate;
  const nomeDepartamentos = departamentos.map((d) => d.nome);
  const allSelected = selectedDepts.length === nomeDepartamentos.length && nomeDepartamentos.length > 0;
  const selectedDeptCount = selectedDepts.length;
  const totalDeptCount = nomeDepartamentos.length;

  // Função para resetar todos os filtros
  const handleResetFilters = useCallback((): void => {
    setActivePreset('30d');
    const defaultRange = calcPresetRange('30d');
    setStartDate(defaultRange.start);
    setEndDate(defaultRange.end);
    setSelectedDepts([]); // Nenhum departamento selecionado
  }, []);

  useEffect(() => {
    getAllDepartamentos()
      .then((deps) => {
        setDepartamentos(deps);
      })
      .catch((err) => logger.error('Reports', 'Erro ao carregar departamentos', err));
  }, []);

  const applyPreset = useCallback((preset: PresetKey): void => {
    setActivePreset(preset);
    if (preset === 'custom') return;
    const range = calcPresetRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
  }, []);

  const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setStartDate(e.target.value);
    setActivePreset('custom');
  }, []);

  const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setEndDate(e.target.value);
    setActivePreset('custom');
  }, []);

  const toggleDepartamento = useCallback((nome: string): void => {
    setSelectedDepts((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome]
    );
  }, []);

  const selectAll = useCallback((): void => {
    setSelectedDepts(nomeDepartamentos);
  }, [nomeDepartamentos]);

  const filteredData = useMemo(() => {
    if (allSelected) return data;

    return data.map((item) => {
      const filteredSetores = item.setores.filter((s) => selectedDepts.includes(s.categoria));
      const totals = calculateTotals(filteredSetores);
      return {
        ...item,
        setores: filteredSetores,
        ...totals,
      };
    }).filter((item) => item.setores.length > 0);
  }, [data, selectedDepts, allSelected]);

  const loadReport = useCallback(async (): Promise<void> => {
    if (!user || !isDateRangeValid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTrocasByDateRange(startDate, endDate);
      setData(result);
      setLoaded(true);
    } catch (err) {
      setError('Erro ao carregar relatório');
      logger.error('Reports', 'Erro ao carregar relatório', err);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate, isDateRangeValid]);

  const kpis = useMemo<KPIData[]>(() => {
    const totalRealizado = filteredData.reduce((sum, t) => sum + t.total_realizado, 0);
    const totalMeta = filteredData.reduce((sum, t) => sum + t.total_meta, 0);
    const totalDiferenca = totalRealizado - totalMeta;
    const pctMedio = totalMeta > 0 ? ((totalRealizado - totalMeta) / totalMeta) * 100 : 0;

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
        formattedValue: formatBRL(totalDiferenca),
        icon: <IconDiferenca />,
        tooltip: 'Diferença entre realizado e meta no período',
        status: totalDiferenca > 0 ? 'negativo' : 'positivo',
      },
      {
        label: 'ATINGIMENTO MÉDIO',
        value: pctMedio,
        formattedValue: `${Math.abs(pctMedio).toFixed(2).replace('.', ',')}%`,
        subValue: `Total: ${formatBRL(totalRealizado)} / ${formatBRL(totalMeta)}`,
        icon: <IconAtingimento />,
        tooltip: 'Percentual médio de atingimento da meta no período',
        status: pctMedio > 0 ? 'negativo' : pctMedio < 0 ? 'positivo' : 'neutro',
      },
    ];
  }, [filteredData]);

  const chartData = useMemo(() => {
    return filteredData.map((t) => {
      const realizado = t.total_realizado ?? 0;
      const meta = t.total_meta ?? 0;
      const diferenca = t.total_diferenca ?? (realizado - meta);

      return {
        id: t.data,
        categoria: formatarDataDiaMesAno(new Date(t.data + 'T00:00:00')),
        realizado,
        meta,
        diferenca,
        percentual: meta > 0 ? ((realizado - meta) / meta) * 100 : 0,
        status: (diferenca > 0 ? 'negativo' : diferenca < 0 ? 'positivo' : 'neutro') as 'positivo' | 'negativo' | 'neutro',
      };
    });
  }, [filteredData]);

  const sortedFilteredData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const va = sortKey === 'data' ? a.data : a[sortKey as keyof TrocasData] as number;
      const vb = sortKey === 'data' ? b.data : b[sortKey as keyof TrocasData] as number;
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = useCallback((key: string): void => {
    setSortKey((prev) => {
      if (prev === key) return prev;
      return key;
    });
    setSortDir((prev) => {
      if (sortKey === key) return prev === 'asc' ? 'desc' : 'asc';
      return 'asc';
    });
  }, [sortKey]);

  const handleRowClick = useCallback((date: string): void => {
    navigate(`/dashboard/${date}`);
  }, [navigate]);

  const diasSelecionados = useMemo(() => {
    if (!isDateRangeValid) return '';
    const diff = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} dia(s)`;
  }, [isDateRangeValid, startDate, endDate]);

  const showSkeleton = loading && !loaded;
  const showError = error && !loaded;
  const showContent = loaded && !loading;

  return (
    <div className="reports" style={{ animation: 'fadeInUp 0.4s ease' }}>
      <header className="reports-header">
        <h1>
          <span className="title-bar" />
          RELATÓRIOS
        </h1>
      </header>

      {/* Filtros em um único card */}
      <div className="filters-container">
        <div className="filter-section">
          <div className="filter-section-row">
            <div className="filter-section-col">
              <div className="filter-section-header">
                <IconPeriodo />
                <h3>Período</h3>
              </div>
              <div className="reports-presets">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    className={`preset-chip ${activePreset === p.key ? 'active' : ''}`}
                    onClick={() => applyPreset(p.key)}
                    aria-pressed={activePreset === p.key}
                    title={PRESET_TOOLTIPS[p.key]}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="filter-date-group">
                <div className="filter-group">
                  <label htmlFor="start-date">Data Inicial</label>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={handleStartChange}
                    aria-label="Data inicial do relatório"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="end-date">Data Final</label>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={handleEndChange}
                    aria-label="Data final do relatório"
                  />
                </div>
              </div>
            </div>

            <div className="filter-section-divider" />

            <div className="filter-section-col">
              <div className="filter-section-header">
                <IconDepartamento />
                <h3>Departamentos</h3>
                <span className="dept-counter">
                  {selectedDeptCount}/{totalDeptCount}
                </span>
              </div>
              <div className="filter-dept-wrapper">
                <div className="dept-chips">
                  <button
                    className={`dept-chip all-chip ${allSelected ? 'selected' : ''}`}
                    onClick={selectAll}
                    aria-pressed={allSelected}
                  >
                    Todos
                  </button>
                  {departamentos.map((dep) => (
                    <button
                      key={dep.id}
                      className={`dept-chip ${selectedDepts.includes(dep.nome) ? 'selected' : ''}`}
                      onClick={() => toggleDepartamento(dep.nome)}
                      aria-pressed={selectedDepts.includes(dep.nome)}
                    >
                      {dep.nome}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="filter-actions-bar">
            <button
              className="btn-secondary"
              onClick={handleResetFilters}
              title="Limpar todos os filtros"
            >
              Resetar Filtros
            </button>
            {isDateRangeValid && diasSelecionados && (
              <span className="dias-hint">
                {diasSelecionados} no período
              </span>
            )}
            {!isDateRangeValid && (
              <span className="date-error">Data final deve ser posterior à inicial</span>
            )}
            <button
              className="btn-primary"
              onClick={loadReport}
              disabled={loading || !isDateRangeValid}
            >
              {loading ? <><span className="btn-spinner" /> Carregando...</> : 'Gerar Relatório'}
            </button>
          </div>
        </div>
      </div>

      {showSkeleton && (
        <div className="reports-loading">
          <div className="reports-loading-grid">
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
          </div>
          <div style={{ height: 300, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
          <div style={{ height: 200, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
        </div>
      )}

      {showError && (
        <div className="reports-empty">
          <h2>Erro ao carregar relatório</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadReport}>Tentar novamente</button>
        </div>
      )}

      {showContent && (
        <>
          {filteredData.length === 0 ? (
            <div className="reports-empty">
              <EmptyChartIcon />
              <h2>Nenhum dado encontrado</h2>
              <p className="empty-hint">
                Nenhum lançamento encontrado para o período e departamentos selecionados.
                Tente ampliar o período ou acesse o Dashboard para registrar valores.
              </p>
              <button className="btn-primary" onClick={() => navigate('/')}>
                Ir para Dashboard
              </button>
            </div>
          ) : (
            <>
              <section className="reports-kpis">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="report-kpi-card">
                    <div className="report-kpi-icon">{kpi.icon}</div>
                    <div className="report-kpi-info">
                      <span className="report-kpi-label">{kpi.label}</span>
                      <span className="report-kpi-value">{kpi.formattedValue}</span>
                      {kpi.subValue && (
                        <span className="report-kpi-sub" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {kpi.subValue}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </section>

              <section className="reports-chart-section">
                <div className="card">
                  <h2>DESEMPENHO POR DIA</h2>
                  {loading ? (
                    <div style={{ height: 300, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }} />
                  ) : (
                    <BarChart data={chartData} />
                  )}
                </div>
              </section>

              <section className="reports-table-section">
                <div className="card tabela-card">
                  <h2>DETALHAMENTO POR DIA</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Clique em uma linha para ver os detalhes do dia
                  </p>
                  <div className="reports-table-wrap">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th
                            className={sortKey === 'data' ? 'sort-active' : ''}
                            onClick={() => handleSort('data')}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSort('data'); }}
                            role="button"
                            aria-sort={sortKey === 'data' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                            style={{ cursor: 'pointer' }}
                          >
                            DATA {sortKey === 'data' && <span className="sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </th>
                          <th
                            className={`align-right ${sortKey === 'total_realizado' ? 'sort-active' : ''}`}
                            onClick={() => handleSort('total_realizado')}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSort('total_realizado'); }}
                            role="button"
                            aria-sort={sortKey === 'total_realizado' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                            style={{ cursor: 'pointer' }}
                          >
                            REALIZADO {sortKey === 'total_realizado' && <span className="sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </th>
                          <th
                            className={`align-right ${sortKey === 'total_meta' ? 'sort-active' : ''}`}
                            onClick={() => handleSort('total_meta')}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSort('total_meta'); }}
                            role="button"
                            aria-sort={sortKey === 'total_meta' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                            style={{ cursor: 'pointer' }}
                          >
                            META {sortKey === 'total_meta' && <span className="sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </th>
                          <th className="align-right">% META</th>
                          <th
                            className={`align-right ${sortKey === 'total_diferenca' ? 'sort-active' : ''}`}
                            onClick={() => handleSort('total_diferenca')}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSort('total_diferenca'); }}
                            role="button"
                            aria-sort={sortKey === 'total_diferenca' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                            style={{ cursor: 'pointer' }}
                          >
                            DIFERENÇA {sortKey === 'total_diferenca' && <span className="sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </th>
                          <th className="align-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedFilteredData.map((t) => {
                          const diff = t.total_diferenca;
                          const pct = t.total_meta > 0 ? ((t.total_realizado - t.total_meta) / t.total_meta) * 100 : 0;
                          const pctClass = pct > 0 ? 'negative' : pct < 0 ? 'positive' : 'neutral';
                          const pctArrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                          return (
                            <tr
                              key={t.id}
                              className="clickable-row"
                              onClick={() => handleRowClick(t.data)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleRowClick(t.data);
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`Ver detalhes de ${formatarDataDiaMesAno(new Date(t.data + 'T00:00:00'))}`}
                            >
                              <td>{formatarDataDiaMesAno(new Date(t.data + 'T00:00:00'))}</td>
                              <td className="align-right">{formatBRL(t.total_realizado)}</td>
                              <td className="align-right">{formatBRL(t.total_meta)}</td>
                              <td className="align-right">
                                <span className={`pct-badge ${pctClass}`}>
                                  {pctArrow} {Math.abs(pct).toFixed(2).replace('.', ',')}%
                                </span>
                              </td>
                              <td className={`align-right ${diff > 0 ? 'negative' : diff < 0 ? 'positive' : ''}`}>
                                <span>{formatBRL(Math.abs(diff))} <span aria-hidden="true">{diff > 0 ? '↑' : diff < 0 ? '↓' : '→'}</span></span>
                              </td>
                              <td className={`align-right status-${diff > 0 ? 'negativo' : diff < 0 ? 'positivo' : 'neutro'}`}>
                                {diff > 0 ? 'Acima' : diff < 0 ? 'Abaixo' : 'Na meta'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;