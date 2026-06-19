import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { Setor, TableColumn, SortConfig } from '../../types/trocas';
import { formatBRL, formatarNumeroEdicao, formatarStatusPercentual, classeStatus } from '../../utils/formatters';
import './DataTable.css';

interface DataTableProps {
  data: Setor[];
  columns: TableColumn[];
  onEdit: (id: string, field: 'realizado' | 'meta', value: number) => void;
  melhorSetor?: string | null;
  setorCritico?: string | null;
  readonly?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onEdit,
  melhorSetor = null,
  setorCritico = null,
  readonly = false,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });
  const [editFeedback, setEditFeedback] = useState<Record<string, 'ok' | 'error'>>({});
  const feedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const getSortValue = (item: Setor): number | string => {
        if (sortConfig.key === 'categoria') return item.categoria.toLowerCase();
        if (sortConfig.key === 'diferenca') return item.diferenca;
        if (sortConfig.key === 'status') return item.percentual;
        const key = sortConfig.key as keyof Setor;
        return (item[key] as number) ?? 0;
      };

      const va = getSortValue(a);
      const vb = getSortValue(b);

      if (typeof va === 'number' && typeof vb === 'number') {
        return sortConfig.direction === 'ascending' ? va - vb : vb - va;
      }

      const vaStr = String(va).toLowerCase();
      const vbStr = String(vb).toLowerCase();
      return sortConfig.direction === 'ascending'
        ? vaStr.localeCompare(vbStr)
        : vbStr.localeCompare(vaStr);
    });
  }, [data, sortConfig]);

  const handleSort = useCallback((key: string): void => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'ascending' ? 'descending' : 'ascending',
        };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  React.useEffect(() => {
    return () => {
      feedbackTimersRef.current.forEach((timer) => clearTimeout(timer));
      feedbackTimersRef.current.clear();
    };
  }, []);

  const showFeedback = useCallback((key: string, type: 'ok' | 'error'): void => {
    const existingTimer = feedbackTimersRef.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    setEditFeedback((prev) => ({ ...prev, [key]: type }));
    const timer = setTimeout(() => {
      setEditFeedback((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      feedbackTimersRef.current.delete(key);
    }, 900);
    feedbackTimersRef.current.set(key, timer);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const { id, field } = input.dataset;
      if (!id || !field) return;

      const cleanValue = input.value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
      const num = parseFloat(cleanValue);

      if (isNaN(num) || num < 0) {
        showFeedback(`${id}-${field}`, 'error');
        return;
      }

      onEdit(id, field as 'realizado' | 'meta', num);
      showFeedback(`${id}-${field}`, 'ok');
      input.blur();
    }
  }, [onEdit, showFeedback]);

  const renderBadge = useCallback((categoria: string): JSX.Element => {
    if (categoria === melhorSetor) {
      return <span className="setor-badge badge-melhor" aria-label="Melhor setor">MELHOR</span>;
    }
    if (categoria === setorCritico) {
      return <span className="setor-badge badge-critico" aria-label="Setor crítico">CRÍTICO</span>;
    }
    return <></>;
  }, [melhorSetor, setorCritico]);

  return (
    <div className="table-wrap">
      <table aria-label="Detalhamento por setor">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`th-${column.key} ${column.sortable ? 'sortable' : ''} ${
                  sortConfig.key === column.key ? 'sort-active' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
                onKeyDown={(e) => {
                  if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSort(column.key);
                  }
                }}
                tabIndex={column.sortable ? 0 : undefined}
                role={column.sortable ? 'button' : undefined}
                aria-sort={
                  sortConfig.key === column.key
                    ? sortConfig.direction === 'ascending' ? 'ascending' : 'descending'
                    : undefined
                }
                style={{ textAlign: column.align || 'center' }}
              >
                {column.header}
                {sortConfig.key === column.key && (
                  <span className="sort-indicator" aria-hidden="true">
                    {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr key={row.id}>
              <td style={{ textAlign: 'left' }}>
                <div className="setor-cell">
                  <span>{row.categoria}</span>
                  {renderBadge(row.categoria)}
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <input
                  type="text"
                  defaultValue={formatarNumeroEdicao(row.realizado)}
                  key={`${row.id}-realizado-${row.realizado}`}
                  data-id={row.id}
                  data-field="realizado"
                  onKeyDown={handleKeyDown}
                  className={`cell-input ${
                    editFeedback[`${row.id}-realizado`] ? `cell-${editFeedback[`${row.id}-realizado`]}` : ''
                  }`}
                  disabled={readonly}
                  aria-label={`${readonly ? 'Visualizar' : 'Editar'} realizado de ${row.categoria}`}
                />
              </td>
              <td style={{ textAlign: 'right' }}>
                <input
                  type="text"
                  defaultValue={formatarNumeroEdicao(row.meta)}
                  key={`${row.id}-meta-${row.meta}`}
                  data-id={row.id}
                  data-field="meta"
                  onKeyDown={handleKeyDown}
                  className={`cell-input ${
                    editFeedback[`${row.id}-meta`] ? `cell-${editFeedback[`${row.id}-meta`]}` : ''
                  }`}
                  disabled={readonly}
                  aria-label={`${readonly ? 'Visualizar' : 'Editar'} meta de ${row.categoria}`}
                />
              </td>
              <td
                style={{ textAlign: 'right' }}
                className={classeStatus(row.diferenca)}
              >
                <span>{formatBRL(Math.abs(row.diferenca))} <span className="diferenca-seta" aria-hidden="true">{row.diferenca > 0 ? '↑' : row.diferenca < 0 ? '↓' : '→'}</span></span>
              </td>
              <td
                style={{ textAlign: 'right' }}
                className={classeStatus(row.diferenca)}
              >
                <span>{formatarStatusPercentual(row.realizado, row.meta)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
