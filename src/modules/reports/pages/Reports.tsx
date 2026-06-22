import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getTrocasByDateRange } from '../../dashboard/services/trocasService';
import { BarChart } from '../../../shared/components/Chart';
import { Loading } from '../../../shared/components/Loading';
import { Error } from '../../../shared/components/Error';
import { IconTotal, IconMeta, IconDiferenca } from '../../../shared/components/Icons';
import { formatBRL, formatarDataDiaMesAno } from '../../../shared/utils/formatters';
import { logger } from '../../../shared/utils/logger';
import type { TrocasData, KPIData } from '../../../shared/types/trocas';
import './Reports.css';

const getDefaultRange = (): { start: string; end: string } => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  };
};

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const defaults = getDefaultRange();
  const [startDate, setStartDate] = useState<string>(defaults.start);
  const [endDate, setEndDate] = useState<string>(defaults.end);
  const [data, setData] = useState<TrocasData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  const isDateRangeValid = startDate <= endDate;

  const loadReport = useCallback(async (): Promise<void> => {
    if (!user) return;

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
  }, [user, startDate, endDate]);

  const kpis = useMemo<KPIData[]>(() => {
    const totalRealizado = data.reduce((sum, t) => sum + t.total_realizado, 0);
    const totalMeta = data.reduce((sum, t) => sum + t.total_meta, 0);
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
        formattedValue: formatBRL(totalDiferenca),
        icon: <IconDiferenca />,
        tooltip: 'Diferença entre realizado e meta no período',
        status: totalDiferenca > 0 ? 'negativo' : 'positivo',
      },
    ];
  }, [data]);

  const chartData = useMemo(() => {
    return data.map((t) => ({
      id: t.data,
      categoria: formatarDataDiaMesAno(new Date(t.data + 'T00:00:00')),
      realizado: t.total_realizado,
      meta: t.total_meta,
      diferenca: t.total_diferenca,
      percentual: t.total_meta > 0 ? ((t.total_realizado - t.total_meta) / t.total_meta) * 100 : 0,
      status: (t.total_realizado - t.total_meta > 0 ? 'negativo' : t.total_realizado - t.total_meta < 0 ? 'positivo' : 'neutro') as 'positivo' | 'negativo' | 'neutro',
    }));
  }, [data]);

  if (loading && !loaded) {
    return <Loading message="Carregando relatório..." />;
  }

  if (error && !loaded) {
    return <Error message={error} onRetry={loadReport} />;
  }

  return (
    <div className="reports">
      <header className="reports-header">
        <h1>
          <span className="title-bar" />
          RELATÓRIOS
        </h1>
      </header>

      <section className="reports-filters">
        <div className="filter-group">
          <label htmlFor="start-date">Data Inicial</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="end-date">Data Final</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          className="btn-primary"
          onClick={loadReport}
          disabled={loading || !isDateRangeValid}
        >
          {loading ? 'Carregando...' : 'Gerar Relatório'}
        </button>
        {!isDateRangeValid && (
          <span className="date-error">A data inicial deve ser anterior à data final</span>
        )}
      </section>

      {loaded && (
        <>
          {data.length === 0 ? (
            <div className="reports-empty">
              <p>Nenhum dado encontrado para o período selecionado.</p>
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
                    </div>
                  </div>
                ))}
              </section>

              <section className="reports-chart-section">
                <div className="card">
                  <h2>DESEMPENHO POR DIA</h2>
                  <BarChart data={chartData} />
                </div>
              </section>

              <section className="reports-table-section">
                <div className="card tabela-card">
                  <h2>DETALHAMENTO POR DIA</h2>
                  <div className="reports-table-wrap">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>DATA</th>
                          <th>REALIZADO</th>
                          <th>META</th>
                          <th>DIFERENÇA</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((t) => {
                          const diff = t.total_diferenca;
                          return (
                            <tr key={t.id}>
                              <td>{formatarDataDiaMesAno(new Date(t.data + 'T00:00:00'))}</td>
                              <td className="align-right">{formatBRL(t.total_realizado)}</td>
                              <td className="align-right">{formatBRL(t.total_meta)}</td>
                              <td className={`align-right ${diff > 0 ? 'negative' : diff < 0 ? 'positive' : ''}`}>
                                {formatBRL(diff)}
                              </td>
                              <td className={`align-right status-${diff > 0 ? 'negativo' : diff < 0 ? 'positivo' : 'neutro'}`}>
                                {diff > 0 ? '↑ Acima' : diff < 0 ? '↓ Abaixo' : '→ Meta'}
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
