import { forwardRef } from 'react';
import './Button.css';

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'icon' | 'fab';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  danger?: boolean;
  loading?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'filled',
    size = 'medium',
    danger = false,
    loading = false,
    iconStart,
    iconEnd,
    children,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const classes = [
      'md-button',
      `md-button--${variant}`,
      `md-button--${size}`,
      danger && 'md-button--danger',
      loading && 'md-button--loading',
      iconStart && 'md-button--icon-start',
      iconEnd && 'md-button--icon-end',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {iconStart}
        {children}
        {iconEnd}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
