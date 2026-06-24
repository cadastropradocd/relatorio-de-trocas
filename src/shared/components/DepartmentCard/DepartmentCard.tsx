import { useState, useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { Setor } from '../../types/trocas';
import { formatBRL, formatarNumeroEdicao, formatarStatusPercentual, classeStatus } from '../../utils/formatters';
import './DepartmentCard.css';

interface DepartmentCardProps {
  setor: Setor;
  isMelhor: boolean;
  isCritico: boolean;
  readonly: boolean;
  onEdit: (id: string, field: 'realizado' | 'meta', value: number) => void;
}

export const DepartmentCard = ({
  setor,
  isMelhor,
  isCritico,
  readonly,
  onEdit,
}: DepartmentCardProps) => {
  const [editFeedback, setEditFeedback] = useState<Record<string, 'ok' | 'error'>>({});
  const feedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const { field } = input.dataset;
      if (!field) return;

      const cleanValue = input.value.replace(/[^0-9.,-]/g, '').replace(',', '.');
      const num = parseFloat(cleanValue);

      if (isNaN(num) || num < 0) {
        showFeedback(`${setor.id}-${field}`, 'error');
        return;
      }

      onEdit(setor.id, field as 'realizado' | 'meta', num);
      showFeedback(`${setor.id}-${field}`, 'ok');
      input.blur();
    }
  }, [onEdit, setor.id, showFeedback]);

  const statusClass = classeStatus(setor.diferenca);
  const isPositivo = setor.diferenca > 0;
  const isNegativo = setor.diferenca < 0;

  return (
    <div className={`department-card ${isMelhor ? 'dept-melhor' : ''} ${isCritico ? 'dept-critico' : ''}`}>
      <div className="dept-header">
        <span className="dept-name">{setor.categoria}</span>
        {isMelhor && <span className="dept-badge badge-melhor">MELHOR</span>}
        {isCritico && <span className="dept-badge badge-critico">CRÍTICO</span>}
      </div>

      <div className="dept-fields">
        <div className="dept-field">
          <label className="dept-label">Realizado</label>
          <input
            type="text"
            defaultValue={formatarNumeroEdicao(setor.realizado)}
            key={`${setor.id}-realizado-${setor.realizado}`}
            data-field="realizado"
            onKeyDown={handleKeyDown}
            className={`dept-input ${
              editFeedback[`${setor.id}-realizado`] ? `cell-${editFeedback[`${setor.id}-realizado`]}` : ''
            }`}
            disabled={readonly}
            aria-label={`${readonly ? 'Visualizar' : 'Editar'} realizado de ${setor.categoria}`}
          />
        </div>

        <div className="dept-field">
          <label className="dept-label">Meta</label>
          <input
            type="text"
            defaultValue={formatarNumeroEdicao(setor.meta)}
            key={`${setor.id}-meta-${setor.meta}`}
            data-field="meta"
            onKeyDown={handleKeyDown}
            className={`dept-input ${
              editFeedback[`${setor.id}-meta`] ? `cell-${editFeedback[`${setor.id}-meta`]}` : ''
            }`}
            disabled={readonly}
            aria-label={`${readonly ? 'Visualizar' : 'Editar'} meta de ${setor.categoria}`}
          />
        </div>
      </div>

      <div className="dept-footer">
        <div className="dept-status-row">
          <span className="dept-label">Diferença</span>
          <span className={`dept-diferenca ${statusClass}`}>
            {formatBRL(Math.abs(setor.diferenca))}
            <span className="dept-seta">{isPositivo ? ' ↑' : isNegativo ? ' ↓' : ' →'}</span>
          </span>
        </div>
        <div className="dept-status-row">
          <span className="dept-label">Atingimento</span>
          <span className={`dept-percentual ${statusClass}`}>
            {formatarStatusPercentual(setor.realizado, setor.meta)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;
