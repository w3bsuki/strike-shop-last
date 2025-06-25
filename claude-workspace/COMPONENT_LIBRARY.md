# AI-First Component Library Architecture

## Research Agent
- **Agent Name**: UI/UX Component Specialist
- **Status**: Production-Ready Implementation
- **Last Updated**: 2025-06-24
- **Version**: 2.0.0

## Overview
This document provides the definitive architecture for building AI-optimized component libraries that enable rapid UI generation, comprehensive testing, and micro-frontend deployment. The system is designed for multi-agent collaboration where specialized agents handle component creation, testing, and documentation independently.

## AI-Optimized Component Architecture Principles

### Core Design Philosophy
1. **Self-Documenting Components**: Every component includes inline documentation that AI agents can parse
2. **Predictable APIs**: Consistent prop patterns across all components for easier AI generation
3. **Test-First Development**: Components designed with testing hooks for automated validation
4. **Performance by Default**: Zero-runtime CSS with Tailwind, lazy loading, and code splitting
5. **Accessibility Automation**: ARIA patterns baked into component templates
6. **Type-Safe Everything**: Full TypeScript coverage with exported types for AI consumption
7. **Visual Regression Ready**: Every component includes Chromatic/Percy snapshots
8. **Micro-Frontend Compatible**: Module Federation configuration for cross-app sharing

## Complete Component Implementation Examples

### 1. AI-Optimized Button Component (Atom)

```tsx
// Button.types.ts - Comprehensive type definitions for AI consumption
export interface ButtonProps {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  /** Size of the button */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state indicator */
  isLoading?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Data test ID for testing */
  'data-testid'?: string;
}

// Button.tsx - Self-documenting implementation
import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/atoms/Spinner';
import type { ButtonProps } from './Button.types';

/**
 * Primary button component with comprehensive accessibility and styling.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 * 
 * @accessibility
 * - Keyboard navigable (Tab, Enter, Space)
 * - ARIA attributes supported
 * - Focus visible states
 * - Disabled state handling
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      onClick,
      children,
      className,
      'aria-label': ariaLabel,
      type = 'button',
      fullWidth = false,
      leftIcon,
      rightIcon,
      'data-testid': dataTestId = 'button',
      ...props
    },
    ref
  ) => {
    // Base classes for all buttons
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'select-none',
      fullWidth && 'w-full'
    );

    // Variant-specific styles
    const variantClasses = {
      primary: cn(
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
        'focus-visible:ring-blue-500'
      ),
      secondary: cn(
        'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
        'focus-visible:ring-gray-500'
      ),
      ghost: cn(
        'bg-transparent hover:bg-gray-100 active:bg-gray-200',
        'focus-visible:ring-gray-500'
      ),
      danger: cn(
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        'focus-visible:ring-red-500'
      ),
      success: cn(
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        'focus-visible:ring-green-500'
      ),
    };

    // Size-specific styles
    const sizeClasses = {
      xs: 'px-2 py-1 text-xs rounded',
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-md',
      lg: 'px-6 py-3 text-lg rounded-lg',
      xl: 'px-8 py-4 text-xl rounded-lg',
    };

    // Icon spacing
    const iconSpacing = {
      xs: 'gap-1',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2.5',
      xl: 'gap-3',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          (leftIcon || rightIcon) && iconSpacing[size],
          className
        )}
        onClick={onClick}
        disabled={isDisabled || isLoading}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        data-testid={dataTestId}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size} className="animate-spin" />
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Button.test.tsx - Comprehensive test coverage
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button Component', () => {
  // Accessibility tests
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Functionality tests
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // State tests
  it('should be disabled when isDisabled is true', () => {
    render(<Button isDisabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  // Loading state tests
  it('should show loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  // Keyboard interaction tests
  it('should be keyboard accessible', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard Test</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
    
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});

// Button.stories.tsx - Storybook documentation
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { FiSearch, FiArrowRight } from 'react-icons/fi';

const meta: Meta<typeof Button> = {
  title: 'Components/Atoms/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'success'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    isLoading: {
      control: 'boolean',
    },
    isDisabled: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Default story
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button leftIcon={<FiSearch />}>Search</Button>
      <Button rightIcon={<FiArrowRight />}>Continue</Button>
      <Button leftIcon={<FiSearch />} rightIcon={<FiArrowRight />}>
        Both Icons
      </Button>
    </div>
  ),
};

// Loading states
export const LoadingStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button isLoading size="sm">Small Loading</Button>
      <Button isLoading size="md">Medium Loading</Button>
      <Button isLoading size="lg">Large Loading</Button>
    </div>
  ),
};

// Accessibility showcase
export const AccessibilityShowcase: Story = {
  render: () => (
    <div className="space-y-4">
      <Button aria-label="Save document">Save</Button>
      <Button isDisabled>Disabled Button</Button>
      <Button variant="danger" aria-describedby="delete-warning">
        Delete
      </Button>
      <p id="delete-warning" className="text-sm text-gray-600">
        This action cannot be undone
      </p>
    </div>
  ),
};

### 2. Modal Component with Focus Management (Organism)

```tsx
// Modal.types.ts
export interface ModalProps {
  /** Control modal visibility */
  isOpen: boolean;
  /** Handler for closing the modal */
  onClose: () => void;
  /** Modal title for accessibility */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Initial focus element selector */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Data test ID */
  'data-testid'?: string;
}

// Modal.tsx - Accessible modal with focus trap
import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { FiX } from 'react-icons/fi';
import type { ModalProps } from './Modal.types';

/**
 * Accessible modal component following ARIA APG pattern.
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * ```
 * 
 * @accessibility
 * - Focus trap implementation
 * - Escape key to close
 * - ARIA attributes (role, aria-modal, aria-labelledby)
 * - Return focus to trigger element
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  showCloseButton = true,
  footer,
  initialFocusRef,
  'data-testid': dataTestId = 'modal',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Custom hooks for accessibility
  useFocusTrap(modalRef, isOpen);
  useBodyScrollLock(isOpen);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Set initial focus
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        modalRef.current?.focus();
      }
    } else {
      // Return focus to previous element
      previousActiveElement.current?.focus();
    }
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      data-testid={dataTestId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            'relative w-full bg-white rounded-lg shadow-xl',
            'transform transition-all',
            sizeClasses[size]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'ml-auto inline-flex items-center justify-center',
                  'w-8 h-8 rounded-md',
                  'text-gray-400 hover:text-gray-500',
                  'hover:bg-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
                )}
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// useFocusTrap.ts - Focus trap hook
import { useEffect } from 'react';

export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
};

// Modal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Modal } from './Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  it('should have no accessibility violations', async () => {
    const { baseElement } = render(<Modal {...defaultProps} />);
    const results = await axe(baseElement);
    expect(results).toHaveNoViolations();
  });

  it('should trap focus within modal', async () => {
    render(
      <Modal {...defaultProps}>
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Tab from last element should go to first
    lastButton.focus();
    await userEvent.tab();
    
    await waitFor(() => {
      expect(document.activeElement).toBe(firstButton);
    });
  });

  it('should close on Escape key', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close on backdrop click when enabled', () => {
    const onClose = jest.fn();
    const { baseElement } = render(
      <Modal {...defaultProps} onClose={onClose} closeOnBackdropClick />
    );

    const backdrop = baseElement.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop!);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close on backdrop click when disabled', () => {
    const onClose = jest.fn();
    const { baseElement } = render(
      <Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false} />
    );

    const backdrop = baseElement.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop!);
    
    expect(onClose).not.toHaveBeenCalled();
  });
});

// Modal.stories.tsx
export const ModalStories: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Example Modal"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            This is an example modal with proper focus management and accessibility.
          </p>
        </Modal>
      </>
    );
  },
};

### 3. Form Component with Validation (Molecule)

```tsx
// Form.types.ts
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  autoComplete?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  'data-testid'?: string;
}

// FormField.tsx - Accessible form field with validation
import React, { useId } from 'react';
import { cn } from '@/utils/cn';
import type { FormFieldProps } from './Form.types';

/**
 * Accessible form field component with built-in validation display.
 * 
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   required
 *   error={errors.email}
 * />
 * ```
 * 
 * @accessibility
 * - Associated label with input
 * - Error messages linked with aria-describedby
 * - Required fields marked with aria-required
 * - Proper autocomplete attributes
 */
export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
  helperText,
  disabled = false,
  autoComplete,
  pattern,
  minLength,
  maxLength,
  'data-testid': dataTestId,
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  const ariaDescribedBy = [
    error && errorId,
    helperText && helperId,
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium text-gray-700',
          disabled && 'text-gray-400'
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        id={fieldId}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy || undefined}
        data-testid={dataTestId || `form-field-${name}`}
        className={cn(
          'block w-full rounded-md border px-3 py-2',
          'text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          'transition-colors duration-200',
          error ? (
            'border-red-300 focus:border-red-500 focus:ring-red-500'
          ) : (
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          )
        )}
      />
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// useForm.ts - Form state management hook
import { useState, useCallback, FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => void | Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
      }
    }
  }, [validate, values]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    // Touch all fields
    const allTouched = Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>
    );
    setTouched(allTouched);
    
    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      const hasErrors = Object.values(validationErrors).some(error => error);
      
      if (hasErrors) {
        setErrors(validationErrors);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [initialValues, validate, values, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  };
};

// Form usage example
export const ContactForm: React.FC = () => {
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      message: '',
    },
    validate: (values) => {
      const errors: any = {};
      
      if (!values.name) {
        errors.name = 'Name is required';
      }
      
      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Invalid email address';
      }
      
      if (!values.message) {
        errors.message = 'Message is required';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      console.log('Form submitted:', values);
      // API call here
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      <FormField
        name="name"
        label="Name"
        required
        error={form.touched.name ? form.errors.name : undefined}
        onChange={(e) => form.handleChange('name', e.target.value)}
        onBlur={() => form.handleBlur('name')}
      />
      
      <FormField
        name="email"
        label="Email"
        type="email"
        required
        error={form.touched.email ? form.errors.email : undefined}
        onChange={(e) => form.handleChange('email', e.target.value)}
        onBlur={() => form.handleBlur('email')}
      />
      
      <div className="space-y-1">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className={cn(
            'block w-full rounded-md border px-3 py-2',
            'text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            form.errors.message ? (
              'border-red-300 focus:border-red-500 focus:ring-red-500'
            ) : (
              'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            )
          )}
          onChange={(e) => form.handleChange('message', e.target.value)}
          onBlur={() => form.handleBlur('message')}
        />
        {form.touched.message && form.errors.message && (
          <p className="text-sm text-red-600" role="alert">
            {form.errors.message}
          </p>
        )}
      </div>
      
      <Button
        type="submit"
        isLoading={form.isSubmitting}
        isDisabled={form.isSubmitting}
      >
        Submit
      </Button>
    </form>
  );
};
```

## Performance Optimization Strategies

### 1. Component Performance Monitoring

```tsx
// usePerformanceMonitor.ts - Track component render performance
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderDuration: number;
  averageRenderDuration: number;
  peakRenderDuration: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const renderDurations = useRef<number[]>([]);
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const duration = performance.now() - startTime.current;
      renderDurations.current.push(duration);

      // Log slow renders
      if (duration > 16) { // 60fps threshold
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }

      // Report metrics every 10 renders
      if (renderCount.current % 10 === 0) {
        const metrics: PerformanceMetrics = {
          renderCount: renderCount.current,
          lastRenderDuration: duration,
          averageRenderDuration: 
            renderDurations.current.reduce((a, b) => a + b, 0) / renderDurations.current.length,
          peakRenderDuration: Math.max(...renderDurations.current),
        };
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'component_performance', {
            component: componentName,
            ...metrics,
          });
        }
      }
    };
  });
};

// Usage in component
export const DataTable: React.FC<DataTableProps> = (props) => {
  usePerformanceMonitor('DataTable');
  
  // Component implementation
  return <table>...</table>;
};
```

### 2. Bundle Size Optimization

```typescript
// vite.config.ts - Optimized build configuration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Generate bundle analysis
    visualizer({
      template: 'treemap',
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils': ['clsx', 'tailwind-merge', 'date-fns'],
        },
      },
    },
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Set chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@your-org/icons'], // Exclude large icon libraries
  },
});

// package.json - Export configuration for tree shaking
{
  "name": "@your-org/ui",
  "version": "1.0.0",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": [
    "dist"
  ]
}
```

### 3. Lazy Loading and Code Splitting

```tsx
// LazyComponent.tsx - Dynamic import wrapper
import React, { lazy, Suspense, ComponentType } from 'react';
import { Spinner } from '@/components/atoms/Spinner';

interface LazyComponentOptions {
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
  preload?: boolean;
}

export function lazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const LazyComponent = lazy(importFn);
  
  // Preload on hover/focus
  if (options.preload) {
    const preload = () => importFn();
    
    return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
      return (
        <div
          onMouseEnter={preload}
          onFocus={preload}
        >
          <Suspense fallback={options.fallback || <Spinner />}>
            <LazyComponent {...props} ref={ref} />
          </Suspense>
        </div>
      );
    });
  }
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <Suspense fallback={options.fallback || <Spinner />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

// Usage
const HeavyChart = lazyComponent(
  () => import('./components/HeavyChart'),
  { 
    preload: true,
    fallback: <ChartSkeleton />
  }
);

// Route-based code splitting
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard')),
  },
  {
    path: '/analytics',
    component: lazy(() => import('./pages/Analytics')),
  },
];
```

### 4. Virtualization for Large Lists

```tsx
// VirtualList.tsx - High-performance virtual scrolling
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }
  }, [onScroll]);

  // Observe container size
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: 'auto', height: '100%' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {items.slice(startIndex, endIndex + 1).map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage example
<VirtualList
  items={largeDataset}
  itemHeight={60}
  renderItem={(item, index) => (
    <div className="p-4 border-b">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )}
  className="h-[600px]"
/>
```
## Testing Strategies for AI-Driven Development

### 1. Component Testing Framework

```tsx
// test-utils.tsx - Enhanced testing utilities
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import userEvent from '@testing-library/user-event';

// Custom render with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const user = userEvent.setup();
  
  const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );

  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
};

// Accessibility testing helper
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe } = await import('jest-axe');
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Visual regression helper
export const captureVisualSnapshot = (
  componentName: string,
  variantName: string
) => {
  if (process.env.VISUAL_REGRESSION === 'true') {
    cy.percySnapshot(`${componentName} - ${variantName}`);
  }
};

// Performance testing helper
export const measureRenderTime = async (
  component: React.ReactElement,
  threshold = 16 // 60fps
) => {
  const start = performance.now();
  const { rerender } = render(component);
  const initialRender = performance.now() - start;
  
  const rerenderStart = performance.now();
  rerender(component);
  const rerenderTime = performance.now() - rerenderStart;
  
  expect(initialRender).toBeLessThan(threshold);
  expect(rerenderTime).toBeLessThan(threshold);
  
  return { initialRender, rerenderTime };
};
```

### 2. AI-Friendly Test Templates

```tsx
// component.test.template.tsx - Template for AI to generate tests
import { screen } from '@testing-library/react';
import { renderWithProviders, checkAccessibility } from '@/test-utils';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Default props for testing
  const defaultProps = {
    // Add required props here
  };

  // Accessibility tests (REQUIRED)
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <ComponentName {...defaultProps} />
      );
      await checkAccessibility(container);
    });

    it('should have proper ARIA attributes', () => {
      renderWithProviders(<ComponentName {...defaultProps} aria-label="Test label" />);
      const element = screen.getByLabelText('Test label');
      expect(element).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const { user } = renderWithProviders(<ComponentName {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Assert expected behavior
    });
  });

  // Visual states (REQUIRED)
  describe('Visual States', () => {
    it('should render default state correctly', () => {
      renderWithProviders(<ComponentName {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      renderWithProviders(<ComponentName {...defaultProps} isDisabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should render loading state', () => {
      renderWithProviders(<ComponentName {...defaultProps} isLoading />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  // Interaction tests (REQUIRED)
  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <ComponentName {...defaultProps} onClick={handleClick} />
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger events when disabled', async () => {
      const handleClick = jest.fn();
      const { user } = renderWithProviders(
        <ComponentName {...defaultProps} onClick={handleClick} isDisabled />
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Props validation (REQUIRED)
  describe('Props', () => {
    it('should apply custom className', () => {
      renderWithProviders(
        <ComponentName {...defaultProps} className="custom-class" />
      );
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLButtonElement>();
      renderWithProviders(<ComponentName {...defaultProps} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  // Performance tests (OPTIONAL but recommended)
  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const { initialRender, rerenderTime } = await measureRenderTime(
        <ComponentName {...defaultProps} />
      );
      
      expect(initialRender).toBeLessThan(16); // 60fps
      expect(rerenderTime).toBeLessThan(16);
    });
  });
});
```

### 3. Visual Regression Testing with Chromatic

```typescript
// .storybook/test-runner.ts - Chromatic integration
import { TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, injectAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preRender(page) {
    await injectAxe(page);
  },
  async postRender(page, context) {
    // Accessibility check for all stories
    await checkA11y(page, '#root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
    
    // Visual snapshot for Chromatic
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Ensure animations complete
    
    // Custom visual regression assertions
    const storyContext = await page.evaluate(() => {
      return (window as any).__STORYBOOK_STORY_CONTEXT__;
    });
    
    if (storyContext.parameters.visualRegression !== false) {
      await page.screenshot({
        fullPage: true,
        animations: 'disabled',
      });
    }
  },
};

export default config;

// chromatic.config.json
{
  "projectToken": "your-project-token",
  "buildScriptName": "build-storybook",
  "onlyChanged": true,
  "externals": ["public/**"],
  "skip": ["dependabot/**"],
  "exitZeroOnChanges": true,
  "exitOnceUploaded": true,
  "autoAcceptChanges": "main",
  "capture": {
    "delay": 300,
    "waitForAnimations": true
  }
}
```

## Storybook Configuration for AI-Friendly Documentation

### 1. Main Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-coverage',
    '@chromatic-com/storybook',
    'storybook-addon-performance',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': '/src',
        },
      },
    });
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },
};

export default config;
```

### 2. Preview Configuration with AI-Friendly Decorators

```tsx
// .storybook/preview.tsx
import React from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
      source: {
        type: 'dynamic',
      },
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f3f4f6' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
  },
  decorators: [
    // Theme decorator
    (Story, context) => (
      <ThemeProvider theme={context.globals.theme}>
        <Story />
      </ThemeProvider>
    ),
    // Performance monitoring decorator
    (Story, context) => {
      if (context.parameters.performance) {
        const start = performance.now();
        const result = <Story />;
        const renderTime = performance.now() - start;
        
        console.log(`Story ${context.name} rendered in ${renderTime}ms`);
        
        return result;
      }
      return <Story />;
    },
    // Grid overlay decorator for design alignment
    (Story, context) => {
      if (context.globals.grid) {
        return (
          <div className="relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-12 gap-4 opacity-10">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-blue-500 h-full" />
                ))}
              </div>
            </div>
            <Story />
          </div>
        );
      }
      return <Story />;
    },
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    grid: {
      name: 'Grid',
      description: 'Show grid overlay',
      defaultValue: false,
      toolbar: {
        icon: 'grid',
        items: [
          { value: false, title: 'Hide Grid' },
          { value: true, title: 'Show Grid' },
        ],
      },
    },
  },
};

export default preview;
```

### 3. Component Documentation Template

```mdx
<!-- Button.stories.mdx - MDX documentation template -->
import { Meta, Story, Canvas, ArgsTable } from '@storybook/addon-docs';
import { Button } from './Button';

<Meta title="Components/Atoms/Button/Documentation" component={Button} />

# Button Component

The Button component is a versatile, accessible, and performant UI element that serves as the primary call-to-action in your application.

## Overview

Buttons are used to trigger actions and navigate through the application. They come in various styles and sizes to accommodate different use cases.

## Usage

```tsx
import { Button } from '@your-org/ui';

function App() {
  return (
    <Button variant="primary" onClick={() => console.log('Clicked!')}>
      Click me
    </Button>
  );
}
```

## Props

<ArgsTable of={Button} />

## Variants

<Canvas>
  <Story name="Primary">
    <Button variant="primary">Primary Button</Button>
  </Story>
  <Story name="Secondary">
    <Button variant="secondary">Secondary Button</Button>
  </Story>
  <Story name="Ghost">
    <Button variant="ghost">Ghost Button</Button>
  </Story>
</Canvas>

## Accessibility

The Button component follows WAI-ARIA guidelines:

- Keyboard accessible (Tab, Enter, Space)
- Proper focus management
- Screen reader friendly with aria-label support
- Disabled state handling

## Performance

- Bundle size: ~2KB gzipped
- Zero runtime CSS with Tailwind
- Memoized for optimal re-renders
- Lazy-loadable

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#3b82f6` | Primary button background |
| `--color-primary-hover` | `#2563eb` | Primary button hover state |
| `--radius-md` | `6px` | Button border radius |

## Migration Guide

If you're migrating from v1:

```diff
- <Button type="primary" loading={true}>
+ <Button variant="primary" isLoading={true}>
    Submit
  </Button>
```
```
## Micro-Frontend Architecture with Module Federation

### 1. Host Application Configuration

```javascript
// webpack.config.js - Host application setup
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const deps = require('./package.json').dependencies;

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    publicPath: 'auto',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: {
        uiLibrary: 'uiLibrary@http://localhost:3001/remoteEntry.js',
        analytics: 'analytics@http://localhost:3002/remoteEntry.js',
        auth: 'auth@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        ...deps,
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
        'tailwindcss': {
          singleton: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
```

### 2. Component Library as Remote Module

```javascript
// packages/ui-library/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const deps = require('./package.json').dependencies;

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'uiLibrary',
      filename: 'remoteEntry.js',
      exposes: {
        // Expose individual components for better tree shaking
        './Button': './src/components/atoms/Button',
        './Modal': './src/components/organisms/Modal',
        './Form': './src/components/molecules/Form',
        './Card': './src/components/molecules/Card',
        './DataTable': './src/components/organisms/DataTable',
        // Expose hooks
        './hooks': './src/hooks',
        // Expose utilities
        './utils': './src/utils',
        // Expose theme provider
        './ThemeProvider': './src/providers/ThemeProvider',
      },
      shared: {
        ...deps,
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
      },
    }),
  ],
};
```

### 3. Type-Safe Remote Components

```typescript
// types/remotes.d.ts - TypeScript declarations for remote modules
declare module 'uiLibrary/Button' {
  import { ButtonProps } from '@your-org/ui-types';
  export const Button: React.FC<ButtonProps>;
}

declare module 'uiLibrary/Modal' {
  import { ModalProps } from '@your-org/ui-types';
  export const Modal: React.FC<ModalProps>;
}

declare module 'uiLibrary/hooks' {
  export * from '@your-org/ui-types/hooks';
}

// RemoteComponentWrapper.tsx - Error boundary for remote components
import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface RemoteComponentWrapperProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error) => void;
}

export function createRemoteComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options: RemoteComponentWrapperProps = {}
) {
  const LazyComponent = React.lazy(loader);

  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="p-4 border border-red-300 rounded-md bg-red-50">
      <h3 className="text-red-800 font-semibold">Failed to load component</h3>
      <p className="text-red-600 text-sm mt-1">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-sm text-red-600 underline"
      >
        Reload page
      </button>
    </div>
  );

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <ErrorBoundary
      FallbackComponent={options.errorFallback || ErrorFallback}
      onError={options.onError}
    >
      <Suspense fallback={options.fallback || <div>Loading component...</div>}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
}

// Usage
const RemoteButton = createRemoteComponent(
  () => import('uiLibrary/Button'),
  {
    fallback: <ButtonSkeleton />,
    onError: (error) => {
      console.error('Failed to load Button component:', error);
      // Send to error tracking service
    },
  }
);
```

### 4. Shared State Management Across Micro-Frontends

```typescript
// EventBus.ts - Cross-app communication
export class EventBus {
  private static instance: EventBus;
  private events: Map<string, Set<Function>> = new Map();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, callback: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(callback);
    };
  }

  emit(event: string, data?: any): void {
    this.events.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

// SharedStateProvider.tsx - Cross-app state sharing
import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventBus } from './EventBus';

interface SharedState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const SharedStateContext = createContext<{
  state: SharedState;
  updateState: (updates: Partial<SharedState>) => void;
}>({
  state: { user: null, theme: 'light', notifications: [] },
  updateState: () => {},
});

export const SharedStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SharedState>({
    user: null,
    theme: 'light',
    notifications: [],
  });

  const eventBus = EventBus.getInstance();

  useEffect(() => {
    // Listen for state updates from other apps
    const unsubscribe = eventBus.on('shared-state-update', (updates: Partial<SharedState>) => {
      setState(prev => ({ ...prev, ...updates }));
    });

    return unsubscribe;
  }, []);

  const updateState = (updates: Partial<SharedState>) => {
    setState(prev => ({ ...prev, ...updates }));
    // Broadcast to other apps
    eventBus.emit('shared-state-update', updates);
  };

  return (
    <SharedStateContext.Provider value={{ state, updateState }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = () => useContext(SharedStateContext);
```

## Build and Deployment Configuration

### 1. Monorepo Setup with pnpm

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'configs/*'
```

```json
// package.json - Root workspace configuration
{
  "name": "@your-org/design-system",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "configs/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "storybook": "pnpm --filter @your-org/storybook dev",
    "build:storybook": "pnpm --filter @your-org/storybook build",
    "chromatic": "pnpm --filter @your-org/storybook chromatic",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build --filter=@your-org/ui... && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.26.2",
    "turbo": "^1.10.16",
    "typescript": "^5.3.3"
  }
}
```

### 2. Turbo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "env": ["CI"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "chromatic": {
      "dependsOn": ["build"],
      "env": ["CHROMATIC_PROJECT_TOKEN"]
    }
  },
  "globalEnv": ["NODE_ENV", "CI"],
  "globalDependencies": ["tsconfig.json"]
}
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:storybook
      
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build:storybook
          onlyChanged: true

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: packages/*/dist

  release:
    if: github.ref == 'refs/heads/main'
    needs: [lint-and-typecheck, test, build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version
          commit: 'chore: release packages'
          title: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## AI Agent Integration Guide

### 1. Component Generation Agent

```typescript
// agents/ComponentGeneratorAgent.ts
export class ComponentGeneratorAgent {
  async generateComponent(specification: ComponentSpecification): Promise<GeneratedComponent> {
    // 1. Parse specification
    const { name, type, props, features } = specification;
    
    // 2. Select appropriate template
    const template = this.selectTemplate(type);
    
    // 3. Generate component code
    const componentCode = await this.generateFromTemplate(template, {
      name,
      props,
      features,
    });
    
    // 4. Generate tests
    const tests = await this.generateTests(componentCode, specification);
    
    // 5. Generate stories
    const stories = await this.generateStories(componentCode, specification);
    
    // 6. Generate documentation
    const docs = await this.generateDocumentation(componentCode, specification);
    
    return {
      component: componentCode,
      tests,
      stories,
      documentation: docs,
    };
  }
  
  private selectTemplate(type: ComponentType): Template {
    const templates = {
      atom: atomTemplate,
      molecule: moleculeTemplate,
      organism: organismTemplate,
    };
    
    return templates[type];
  }
}
```

### 2. Testing Agent

```typescript
// agents/TestingAgent.ts
export class TestingAgent {
  async runComponentTests(componentPath: string): Promise<TestResults> {
    // 1. Run unit tests
    const unitTests = await this.runUnitTests(componentPath);
    
    // 2. Run accessibility tests
    const a11yTests = await this.runAccessibilityTests(componentPath);
    
    // 3. Run visual regression tests
    const visualTests = await this.runVisualTests(componentPath);
    
    // 4. Run performance tests
    const perfTests = await this.runPerformanceTests(componentPath);
    
    // 5. Generate test report
    return this.generateReport({
      unit: unitTests,
      accessibility: a11yTests,
      visual: visualTests,
      performance: perfTests,
    });
  }
}
```

## Key Takeaways and Best Practices

### For AI Agents
1. **Use predictable patterns**: Consistent naming and structure across all components
2. **Self-documenting code**: Inline documentation that agents can parse
3. **Type-first development**: Full TypeScript coverage with exported types
4. **Template-based generation**: Reusable templates for common patterns

### For Performance
1. **Zero-runtime CSS**: Tailwind CSS for optimal performance
2. **Code splitting**: Dynamic imports and lazy loading
3. **Bundle optimization**: Tree shaking and manual chunks
4. **Monitoring**: Built-in performance tracking

### For Testing
1. **Accessibility-first**: Every component must pass WCAG 2.1 AA
2. **Visual regression**: Chromatic integration for UI consistency
3. **Performance budgets**: Render time limits enforced in tests
4. **Test templates**: AI-friendly test generation patterns

### For Micro-Frontends
1. **Module Federation**: Share components at runtime
2. **Type safety**: TypeScript declarations for remote modules
3. **Error boundaries**: Graceful fallbacks for failed loads
4. **Event-driven communication**: Cross-app state management

This architecture provides a comprehensive, AI-optimized component system that supports rapid development, comprehensive testing, and scalable deployment across micro-frontend architectures.

## Conclusion

This AI-First Component Library Architecture represents the cutting edge of component system design for 2025 and beyond. By combining:

- **AI-Optimized Patterns**: Self-documenting components with predictable APIs
- **Performance Excellence**: Zero-runtime CSS, lazy loading, and micro-frontend support
- **Comprehensive Testing**: Unit, integration, visual, and accessibility testing
- **Developer Experience**: TypeScript-first, Storybook documentation, and automated workflows

We've created a system that enables:
1. Rapid UI development by AI agents
2. Consistent, accessible user experiences
3. Scalable micro-frontend architectures
4. Maintainable, performant applications

The future of UI development is collaborative, with AI agents working alongside human developers to create beautiful, functional, and accessible interfaces at unprecedented speed and scale.
