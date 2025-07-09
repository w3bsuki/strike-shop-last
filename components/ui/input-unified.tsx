import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual variant */
  variant?: 'default' | 'filled' | 'underline';
  /** Error state with optional message */
  error?: boolean | string;
  /** Success state */
  success?: boolean;
  /** Helper text below input */
  helperText?: string;
  /** Icon to display at the start */
  startIcon?: React.ReactNode;
  /** Icon to display at the end */
  endIcon?: React.ReactNode;
}

/**
 * Unified Input Component
 * 
 * Consistent input styling with built-in accessibility.
 * Enforces 48px minimum height for touch targets.
 * 
 * @example
 * <Input 
 *   type="email" 
 *   placeholder="Email address"
 *   error="Invalid email format"
 * />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type,
    variant = 'default',
    error,
    success,
    helperText,
    startIcon,
    endIcon,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseStyles = cn(
      'flex w-full min-h-[48px] px-4 py-3 text-base transition-all duration-200',
      'placeholder:text-muted-foreground',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'focus:outline-none',
      // Add padding for icons
      startIcon && 'pl-11',
      (endIcon || isPassword) && 'pr-11'
    );

    const variantStyles = {
      default: cn(
        'bg-background border border-input',
        'focus:border-foreground focus:ring-1 focus:ring-foreground',
        error && 'border-destructive focus:border-destructive focus:ring-destructive',
        success && 'border-green-600 focus:border-green-600 focus:ring-green-600'
      ),
      filled: cn(
        'bg-gray-50 border border-transparent',
        'focus:bg-background focus:border-foreground focus:ring-1 focus:ring-foreground',
        error && 'bg-red-50 focus:border-destructive focus:ring-destructive',
        success && 'bg-green-50 focus:border-green-600 focus:ring-green-600'
      ),
      underline: cn(
        'bg-transparent border-0 border-b border-input rounded-none px-0',
        'focus:border-b-2 focus:border-foreground',
        error && 'border-destructive focus:border-destructive',
        success && 'border-green-600 focus:border-green-600'
      ),
    };

    return (
      <div className="relative">
        {/* Start Icon */}
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          className={cn(
            baseStyles,
            variantStyles[variant],
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error || helperText 
              ? `${props.id || props.name}-helper` 
              : undefined
          }
          {...props}
        />

        {/* End Icon / Status Indicators */}
        {(endIcon || isPassword || success || error) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {success && !error && (
              <Check className="h-5 w-5 text-success" aria-label="Valid input" />
            )}
            {error && (
              <AlertCircle className="h-5 w-5 text-destructive" aria-label="Invalid input" />
            )}
            {isPassword && !success && !error && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
            {endIcon && !isPassword && !success && !error && endIcon}
          </div>
        )}

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <p 
            id={`${props.id || props.name}-helper`}
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {typeof error === 'string' ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Form Field Component
 * 
 * Wrapper for inputs with label and proper accessibility.
 * 
 * @example
 * <FormField label="Email" required>
 *   <Input type="email" />
 * </FormField>
 */
interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactElement<any>;
  className?: string;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, children, className }, ref) => {
    const childId = children.props?.id || children.props?.name || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <label 
          htmlFor={childId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {React.cloneElement(children, { id: childId })}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { Input };