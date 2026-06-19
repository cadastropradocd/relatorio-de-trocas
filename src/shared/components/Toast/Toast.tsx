import { useToast } from '../../../app/providers/ToastProvider';
import type { ToastMessage } from '../../types/trocas';
import './Toast.css';

const TOAST_ICONS: Record<ToastMessage['type'], string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

const TOAST_COLORS: Record<ToastMessage['type'], { border: string; color: string }> = {
  success: { border: 'var(--ok)', color: 'var(--ok)' },
  error: { border: 'var(--danger)', color: 'var(--danger)' },
  warning: { border: 'var(--accent)', color: 'var(--accent)' },
  info: { border: 'var(--brand)', color: 'var(--brand)' },
};

export const Toast: React.FC = () => {
  const { toasts, removeToast, pauseToast, resumeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const colors = TOAST_COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            style={{
              borderColor: colors.border,
              color: colors.color,
            }}
            onMouseEnter={() => pauseToast(toast.id)}
            onMouseLeave={() => resumeToast(toast.id)}
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span className="toast-icon">{TOAST_ICONS[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
              aria-label="Fechar notificação"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
