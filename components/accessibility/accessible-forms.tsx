'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAria, AccessibleField, AriaAlert, AriaStatus } from './aria-helpers';
import { AccessibleButton } from './aria-helpers';

/**
 * Enhanced Form Accessibility System
 * Implements WCAG 2.1 AA compliant forms with comprehensive validation
 */

interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (data: FormData, validation: FormValidationResult) => void | Promise<void>;
  validation?: (data: FormData) => FormValidationResult;
  className?: string;
  title?: string;
  description?: string;
  noValidate?: boolean;
}

export function AccessibleForm({
  children,
  onSubmit,
  validation,
  className = '',
  title,
  description,
  noValidate = true
}: AccessibleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { announceToScreenReader } = useAria();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setIsSubmitting(true);

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    
    // Run validation if provided
    let validationResult: FormValidationResult = { isValid: true, errors: {}, warnings: {} };
    if (validation) {
      validationResult = validation(formData);
    }

    setErrors(validationResult.errors);

    if (!validationResult.isValid) {
      setIsSubmitting(false);
      
      // Announce errors to screen readers
      const errorCount = Object.keys(validationResult.errors).length;
      announceToScreenReader(
        `Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}. Please review and correct.`,
        'assertive'
      );

      // Focus first field with error
      const firstErrorField = Object.keys(validationResult.errors)[0];
      if (firstErrorField) {
        const field = formRef.current.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (field && typeof field.focus === 'function') {
          field.focus();
        }
      }
      return;
    }

    try {
      await onSubmit(formData, validationResult);
      announceToScreenReader('Form submitted successfully', 'polite');
    } catch (error) {
      announceToScreenReader('Form submission failed. Please try again.', 'assertive');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validation, announceToScreenReader]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate={noValidate}
      className={className}
      role="form"
      aria-labelledby={title ? 'form-title' : undefined}
      aria-describedby={description ? 'form-description' : undefined}
    >
      {title && (
        <h2 id="form-title" className="text-xl font-semibold mb-4">
          {title}
        </h2>
      )}
      
      {description && (
        <p id="form-description" className="text-muted-foreground mb-6">
          {description}
        </p>
      )}

      {/* Global form errors */}
      {submitAttempted && Object.keys(errors).length > 0 && (
        <AriaAlert variant="error" title="Form Validation Errors" className="mb-6">
          <ul className="list-disc pl-4 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </AriaAlert>
      )}

      <div className="space-y-6">
        {children}
      </div>

      {isSubmitting && (
        <AriaStatus className="mt-4">
          Form is being submitted...
        </AriaStatus>
      )}
    </form>
  );
}

/**
 * Enhanced Input Component with comprehensive accessibility
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
  showLength?: boolean;
  maxLength?: number;
}

export function AccessibleInput({
  label,
  description,
  error,
  required = false,
  validation,
  showLength = false,
  maxLength,
  className = '',
  onChange,
  onBlur,
  ...props
}: AccessibleInputProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [value, setValue] = useState(props.defaultValue?.toString() || '');
  
  const displayError = error || (isTouched ? internalError : null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Run validation
    if (validation && isTouched) {
      const validationError = validation(newValue);
      setInternalError(validationError);
    }
    
    if (onChange) {
      onChange(e);
    }
  }, [onChange, validation, isTouched]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    
    // Run validation on blur
    if (validation) {
      const validationError = validation(e.target.value);
      setInternalError(validationError);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur, validation]);

  const lengthInfo = showLength && maxLength ? `${value.length}/${maxLength}` : null;

  return (
    <AccessibleField
      label={label}
      {...(description && { description })}
      {...(displayError && { error: displayError })}
      required={required}
      className={className}
    >
      <div className="relative">
        <input
          {...props}
          className={`
            strike-input w-full
            ${displayError ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
            ${className}
          `}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={displayError ? 'true' : undefined}
          aria-required={required}
          maxLength={maxLength}
        />
        
        {lengthInfo && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {lengthInfo}
          </div>
        )}
      </div>
    </AccessibleField>
  );
}

/**
 * Enhanced Textarea Component
 */
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
  showLength?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

export function AccessibleTextarea({
  label,
  description,
  error,
  required = false,
  validation,
  showLength = false,
  maxLength,
  autoResize = false,
  className = '',
  onChange,
  onBlur,
  ...props
}: AccessibleTextareaProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [value, setValue] = useState(props.defaultValue?.toString() || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const displayError = error || (isTouched ? internalError : null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Auto-resize if enabled
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    // Run validation
    if (validation && isTouched) {
      const validationError = validation(newValue);
      setInternalError(validationError);
    }
    
    if (onChange) {
      onChange(e);
    }
  }, [onChange, validation, isTouched, autoResize]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsTouched(true);
    
    // Run validation on blur
    if (validation) {
      const validationError = validation(e.target.value);
      setInternalError(validationError);
    }
    
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur, validation]);

  const lengthInfo = showLength && maxLength ? `${value.length}/${maxLength}` : null;

  return (
    <AccessibleField
      label={label}
      {...(description && { description })}
      {...(displayError && { error: displayError })}
      required={required}
      className={className}
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          {...props}
          className={`
            strike-input w-full resize-none
            ${displayError ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
            ${autoResize ? 'overflow-hidden' : ''}
            ${className}
          `}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={displayError ? 'true' : undefined}
          aria-required={required}
          maxLength={maxLength}
        />
        
        {lengthInfo && (
          <div className="absolute right-3 bottom-3 text-xs text-muted-foreground pointer-events-none">
            {lengthInfo}
          </div>
        )}
      </div>
    </AccessibleField>
  );
}

/**
 * Enhanced Select Component
 */
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AccessibleSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export function AccessibleSelect({
  label,
  description,
  error,
  required = false,
  options,
  placeholder,
  className = '',
  ...props
}: AccessibleSelectProps) {
  return (
    <AccessibleField
      label={label}
      {...(description && { description })}
      {...(error && { error })}
      required={required}
      className={className}
    >
      <select
        {...props}
        className={`
          strike-input w-full
          ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : undefined}
        aria-required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </AccessibleField>
  );
}

/**
 * Enhanced Checkbox Component
 */
interface AccessibleCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export function AccessibleCheckbox({
  label,
  description,
  error,
  className = '',
  ...props
}: AccessibleCheckboxProps) {
  return (
    <AccessibleField
      label=""
      {...(description && { description })}
      {...(error && { error })}
      className={className}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          {...props}
          className={`
            mt-0.5 w-4 h-4 border-2 border-input bg-background
            rounded-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            checked:bg-primary checked:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-destructive' : ''}
          `}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={description ? `${props.id}-description` : undefined}
        />
        <label htmlFor={props.id} className="text-sm font-medium cursor-pointer">
          {label}
          {props.required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      </div>
    </AccessibleField>
  );
}

/**
 * Form validation utilities
 */
export const FormValidators = {
  required: (message = 'This field is required') => (value: string) => {
    return value.trim() ? null : message;
  },

  email: (message = 'Please enter a valid email address') => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    return value.length >= min 
      ? null 
      : message || `Must be at least ${min} characters`;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    return value.length <= max 
      ? null 
      : message || `Must be no more than ${max} characters`;
  },

  pattern: (pattern: RegExp, message: string) => (value: string) => {
    return pattern.test(value) ? null : message;
  },

  combine: (...validators: Array<(value: string) => string | null>) => (value: string) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  },
};

/**
 * Example usage component
 */
export function ContactFormExample() {
  const handleSubmit = useCallback((formData: FormData, _validation: FormValidationResult) => {
    console.log('Form submitted:', Object.fromEntries(formData));
  }, []);

  const validateForm = useCallback((formData: FormData): FormValidationResult => {
    const errors: Record<string, string> = {};
    
    const name = formData.get('name')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const message = formData.get('message')?.toString() || '';

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!message.trim()) {
      errors.message = 'Message is required';
    } else if (message.length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings: {}
    };
  }, []);

  return (
    <AccessibleForm
      onSubmit={handleSubmit}
      validation={validateForm}
      title="Contact Us"
      description="Send us a message and we'll get back to you as soon as possible."
      className="max-w-md mx-auto p-6 border rounded-none"
    >
      <AccessibleInput
        name="name"
        label="Full Name"
        required
        placeholder="Enter your full name"
      />

      <AccessibleInput
        name="email"
        type="email"
        label="Email Address"
        required
        placeholder="Enter your email"
        description="We'll never share your email with anyone else"
      />

      <AccessibleTextarea
        name="message"
        label="Message"
        required
        placeholder="Enter your message"
        autoResize
        showLength
        maxLength={500}
        description="Please describe your inquiry in detail"
      />

      <AccessibleCheckbox
        name="newsletter"
        id="newsletter"
        label="Subscribe to our newsletter"
        description="Receive updates about new products and promotions"
      />

      <AccessibleButton type="submit" variant="primary" className="w-full">
        Send Message
      </AccessibleButton>
    </AccessibleForm>
  );
}