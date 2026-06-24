import { forwardRef } from 'react';
import './Chip.css';

type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';
type ChipSize = 'small' | 'medium' | 'large';
type ChipStatus = 'positive' | 'negative' | 'neutral';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  status?: ChipStatus;
  elevated?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  onClose?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({
    variant = 'assist',
    size = 'medium',
    selected = false,
    status,
    elevated = false,
    icon,
    iconPosition = 'start',
    onClose,
    children,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const classes = [
      'md-chip',
      `md-chip--${variant}`,
      size !== 'medium' && `md-chip--${size}`,
      selected && 'md-chip--selected',
      status && `md-chip--${status}`,
      elevated && 'md-chip--elevated',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled}
        aria-pressed={variant === 'filter' ? selected : undefined}
        {...props}
      >
        {icon && iconPosition === 'start' && (
          <span className="md-chip__icon md-chip__icon--leading">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'end' && (
          <span className="md-chip__icon md-chip__icon--trailing">{icon}</span>
        )}
        {onClose && (
          <span
            className="md-chip__close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            role="button"
            tabIndex={-1}
            aria-label="Remover"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

/* Chip Group */
export const ChipGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`md-chip-group ${className}`} {...props}>{children}</div>
);

export default Chip;
