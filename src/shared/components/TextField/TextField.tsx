import { forwardRef } from 'react';
import './TextField.css';

type TextFieldVariant = 'outlined' | 'filled';

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: TextFieldVariant;
  label: string;
  helperText?: string;
  error?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({
    variant = 'outlined',
    label,
    helperText,
    error = false,
    iconLeading,
    iconTrailing,
    fullWidth = true,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const containerClasses = [
      'md-textfield',
      `md-textfield--${variant}`,
      error && 'md-textfield--error',
      fullWidth && 'md-textfield--full-width',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {iconLeading && (
          <span className="md-textfield__icon-leading">{iconLeading}</span>
        )}
        <input
          ref={ref}
          className="md-textfield__input"
          placeholder=" "
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={helperText ? 'helper-text' : undefined}
          {...props}
        />
        <label className="md-textfield__label">{label}</label>
        {iconTrailing && (
          <span className="md-textfield__icon-trailing">{iconTrailing}</span>
        )}
        {helperText && (
          <span
            id="helper-text"
            className={`md-textfield__helper ${error ? 'md-textfield__helper--error' : ''}`}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
export default TextField;
