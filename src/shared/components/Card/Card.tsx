import { forwardRef } from 'react';
import './Card.css';

type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  clickable?: boolean;
  positive?: boolean;
  negative?: boolean;
  kpi?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'elevated',
    clickable = false,
    positive = false,
    negative = false,
    kpi = false,
    children,
    className = '',
    ...props
  }, ref) => {
    const classes = [
      'md-card',
      `md-card--${variant}`,
      clickable && 'md-card--clickable',
      positive && 'md-card--positive',
      negative && 'md-card--negative',
      kpi && 'md-card--kpi',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/* Sub-components for semantic structure */
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`md-card__header ${className}`} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`md-card__title ${className}`} {...props}>{children}</h3>
);

export const CardSubtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`md-card__subtitle ${className}`} {...props}>{children}</p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`md-card__content ${className}`} {...props}>{children}</div>
);

export const CardActions: React.FC<React.HTMLAttributes<HTMLDivElement> & { right?: boolean; full?: boolean }> = ({ children, right = false, full = false, className = '', ...props }) => (
  <div className={`md-card__actions ${right ? 'md-card__actions--right' : ''} ${full ? 'md-card__actions--full' : ''} ${className}`} {...props}>{children}</div>
);

export default Card;
