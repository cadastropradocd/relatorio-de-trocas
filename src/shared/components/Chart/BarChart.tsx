import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Setor } from '../../../shared/types/trocas';
import { formatBRL } from '../../../shared/utils/formatters';
import './BarChart.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: Setor[];
}

const getChartColors = () => ({
  realizadoOk: '#3b82f6',
  realizadoOkBorder: '#1d4ed8',
  realizadoNok: '#ef4444',
  realizadoNokBorder: '#dc2626',
  meta: 'rgba(251, 191, 36, 0.6)',
  metaBorder: 'rgba(251, 191, 36, 0.8)',
  grid: 'rgba(255, 255, 255, 0.06)',
  text: '#94a3b8',
});

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const colors = getChartColors();

  const chartData = useMemo(() => ({
    labels: data.map((d) => d.categoria),
    datasets: [
      {
        label: 'Realizado',
        data: data.map((d) => d.realizado),
        backgroundColor: data.map((d) =>
          d.realizado >= d.meta ? colors.realizadoOk : colors.realizadoNok
        ),
        borderColor: data.map((d) =>
          d.realizado >= d.meta ? colors.realizadoOkBorder : colors.realizadoNokBorder
        ),
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
      {
        label: 'Meta',
        data: data.map((d) => d.meta),
        backgroundColor: colors.meta,
        borderColor: colors.metaBorder,
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
    ],
  }), [data, colors]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: colors.text,
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
            if (context.dataset.label === 'Realizado') {
              const item = data[context.dataIndex];
              if (!item) return '';
              return `Realizado: ${formatBRL(item.realizado)}`;
            }
            return `Meta: ${formatBRL(context.raw as number)}`;
          },
          afterBody: (items): string[] => {
            const item = data[items[0]?.dataIndex];
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
        grid: { color: colors.grid, drawBorder: false },
        ticks: { color: colors.text, font: { weight: '600', size: 9 }, maxRotation: 30 },
        border: { display: false },
      },
      y: {
        grid: { color: colors.grid, drawBorder: false },
        ticks: {
          color: colors.text,
          font: { weight: '600', size: 9 },
          callback: (value: number | string): string => formatBRL(Number(value))
        },
        border: { display: false },
      },
    },
  }), [data, colors]);

  return (
    <div className="chart-wrap">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
