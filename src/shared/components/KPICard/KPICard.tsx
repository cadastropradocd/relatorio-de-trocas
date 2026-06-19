import { useEffect, useRef } from 'react';
import type { KPIData } from '../../types/trocas';
import './KPICard.css';

interface KPICardProps {
  data: KPIData;
  animate?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ data, animate = false }) => {
  const valueRef = useRef<HTMLElement>(null);
  const startValueRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!animate || !valueRef.current) return;

    const element = valueRef.current;
    const targetValue = data.value;
    const startValue = startValueRef.current !== null
      ? startValueRef.current
      : parseFloat(element.textContent?.replace(/[^0-9.-]/g, '') || '0') || 0;

    startValueRef.current = targetValue;
    const duration = 600;
    const startTime = performance.now();

    const animateValue = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easing;

      element.textContent = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animateValue);
      }
    };

    frameRef.current = requestAnimationFrame(animateValue);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [data.value, animate]);

  useEffect(() => {
    if (valueRef.current && !animate) {
      valueRef.current.textContent = data.formattedValue;
    }
    startValueRef.current = data.value;
  }, [data.formattedValue, data.value, animate]);

  return (
    <article
      className={`kpi-card ${
        data.status === 'negativo' ? 'estado-critico' :
        data.status === 'positivo' ? 'estado-bom' : ''
      }`}
      data-tooltip={data.tooltip}
    >
      <span className="kpi-label">
        {data.icon}
        <span>{data.label}</span>
      </span>
      <strong className="kpi-value" ref={valueRef}>
        {data.formattedValue}
      </strong>
      {data.subValue && (
        <span className="kpi-subvalue">{data.subValue}</span>
      )}
    </article>
  );
};

export default KPICard;
