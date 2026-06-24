import { useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Setor } from '../../../shared/types/trocas';
import { formatBRL } from '../../../shared/utils/formatters';
import './BarChart.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: Setor[];
}

const CHART_COLORS = {
  realizadoOk: '#1565c0',
  realizadoOkBorder: '#0d47a1',
  realizadoNok: '#c62828',
  realizadoNokBorder: '#8c1d18',
  meta: 'rgba(255, 214, 0, 0.5)',
  metaBorder: 'rgba(255, 214, 0, 0.7)',
  grid: 'rgba(255, 255, 255, 0.06)',
  text: '#9aa0a6',
} as const;

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const dataRef = useRef(data);
  dataRef.current = data;

  const chartData = useMemo(() => ({
    labels: data.map((d) => d.categoria),
    datasets: [
      {
        label: 'Realizado',
        data: data.map((d) => d.realizado),
        backgroundColor: data.map((d) =>
          d.realizado <= d.meta ? CHART_COLORS.realizadoOk : CHART_COLORS.realizadoNok
        ),
        borderColor: data.map((d) =>
          d.realizado <= d.meta ? CHART_COLORS.realizadoOkBorder : CHART_COLORS.realizadoNokBorder
        ),
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
      {
        label: 'Meta',
        data: data.map((d) => d.meta),
        backgroundColor: CHART_COLORS.meta,
        borderColor: CHART_COLORS.metaBorder,
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: CHART_COLORS.text,
          font: { weight: '700', size: 10 },
          boxWidth: 12,
          boxHeight: 12,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { weight: '700' },
        bodyFont: { weight: '600' },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context: TooltipItem<'bar'>): string => {
            const items = dataRef.current;
            if (context.dataset.label === 'Realizado') {
              const item = items[context.dataIndex];
              if (!item) return '';
              return `Realizado: ${formatBRL(item.realizado)}`;
            }
            return `Meta: ${formatBRL(context.raw as number)}`;
          },
          afterBody: (items): string[] => {
            const item = dataRef.current[items[0]?.dataIndex];
            if (!item) return [];

            const pct = Math.abs(item.percentual).toFixed(2).replace('.', ',');
            const arrow = item.diferenca > 0 ? '↑' : item.diferenca < 0 ? '↓' : '→';
            return [
              `Diferença: ${formatBRL(Math.abs(item.diferenca))} ${arrow}`,
              `Atingimento: ${pct}% ${arrow}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: CHART_COLORS.grid, drawBorder: false },
        ticks: { color: CHART_COLORS.text, font: { weight: '600', size: 9 }, maxRotation: 30 },
        border: { display: false },
      },
      y: {
        grid: { color: CHART_COLORS.grid, drawBorder: false },
        ticks: {
          color: CHART_COLORS.text,
          font: { weight: '600', size: 9 },
          callback: (value: number | string): string => formatBRL(Number(value))
        },
        border: { display: false },
      },
    },
  }), []);

  return (
    <div className="chart-wrap">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
