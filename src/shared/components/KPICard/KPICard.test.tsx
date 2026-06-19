import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';

describe('KPICard Component', () => {
  const mockData = {
    label: 'Total Realizado',
    value: 1000,
    formattedValue: 'R$ 1.000,00',
    status: 'positivo' as const,
    icon: '📊',
    tooltip: 'Valor total realizado',
  };

  it('deve renderizar o componente com os dados corretos', () => {
    render(<KPICard data={mockData} />);

    expect(screen.getByText('Total Realizado')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('deve aplicar a classe de status correta', () => {
    const { container } = render(<KPICard data={mockData} />);
    expect(container.firstChild).toHaveClass('estado-bom');
  });

  it('deve aplicar a classe de status negativo quando apropriado', () => {
    const negativeData = { ...mockData, status: 'negativo' as const };
    const { container } = render(<KPICard data={negativeData} />);
    expect(container.firstChild).toHaveClass('estado-critico');
  });

  it('deve renderizar subValue quando fornecido', () => {
    const dataWithSubValue = {
      ...mockData,
      subValue: '20,00% acima da meta total',
    };
    render(<KPICard data={dataWithSubValue} />);

    expect(screen.getByText('20,00% acima da meta total')).toBeInTheDocument();
  });

  it('deve adicionar tooltip como atributo data-tooltip', () => {
    const { container } = render(<KPICard data={mockData} />);
    expect(container.firstChild).toHaveAttribute('data-tooltip', 'Valor total realizado');
  });

  it('nao deve renderizar subValue quando nao fornecido', () => {
    render(<KPICard data={mockData} />);
    const article = screen.getByRole('article');
    expect(article.querySelectorAll('.kpi-subvalue')).toHaveLength(0);
  });
});
