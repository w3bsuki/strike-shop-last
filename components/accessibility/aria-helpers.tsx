'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ARIA Helpers and Utilities
 * Comprehensive ARIA implementation for WCAG 2.1 AA compliance
 */

interface AriaContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  generateId: (prefix?: string) => string;
  setAriaDescribedBy: (elementId: string, descriptionId: string) => void;
  setAriaLabelledBy: (elementId: string, labelId: string) => void;
}

const AriaContext = createContext<AriaContextType | null>(null);

export function useAria() {
  const context = useContext(AriaContext);
  if (!context) {
    throw new Error('useAria must be used within an AriaProvider');
  }
  return context;
}

interface AriaProviderProps {
  children: React.ReactNode;
}

export function AriaProvider({ children }: AriaProviderProps) {
  const [announcements, setAnnouncements] = useState<{
    polite: string;
    assertive: string;
  }>({
    polite: '',
    assertive: ''
  });

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => ({
      ...prev,
      [priority]: ''
    }));

    // Use a timeout to ensure the message is announced
    setTimeout(() => {
      setAnnouncements(prev => ({
        ...prev,
        [priority]: message
      }));
    }, 100);

    // Clear the message after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => ({
        ...prev,
        [priority]: ''
      }));
    }, 5000);
  }, []);

  const generateId = useCallback((prefix: string = 'aria') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const setAriaDescribedBy = useCallback((elementId: string, descriptionId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-describedby', descriptionId);
    }
  }, []);

  const setAriaLabelledBy = useCallback((elementId: string, labelId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-labelledby', labelId);
    }
  }, []);

  const value: AriaContextType = {
    announceToScreenReader,
    generateId,
    setAriaDescribedBy,
    setAriaLabelledBy,
  };

  return (
    <AriaContext.Provider value={value}>
      {children}
      
      {/* Screen Reader Announcement Regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="polite-announcements"
      >
        {announcements.polite}
      </div>
      
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="assertive-announcements"
      >
        {announcements.assertive}
      </div>
    </AriaContext.Provider>
  );
}

/**
 * ARIA Landmark Component
 * Provides semantic landmarks for screen readers
 */
interface LandmarkProps {
  children: React.ReactNode;
  role: 'banner' | 'navigation' | 'main' | 'complementary' | 'contentinfo' | 'search' | 'form' | 'region';
  label?: string;
  labelledBy?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Landmark({ 
  children, 
  role, 
  label, 
  labelledBy, 
  className = '',
  as: Component = 'div'
}: LandmarkProps) {
  const id = `landmark-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <Component
      role={role}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={className}
      id={id}
    >
      {children}
    </Component>
  );
}

/**
 * ARIA Description Component
 * Provides accessible descriptions for form fields and interactive elements
 */
interface AriaDescriptionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function AriaDescription({ children, id, className = 'sr-only' }: AriaDescriptionProps) {
  const generatedId = `desc-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = id || generatedId;

  return (
    <div
      id={descriptionId}
      className={className}
      role="note"
      aria-live="polite"
    >
      {children}
    </div>
  );
}

/**
 * ARIA Status Component
 * Announces status changes to screen readers
 */
interface AriaStatusProps {
  children: React.ReactNode;
  level?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export function AriaStatus({ 
  children, 
  level = 'polite', 
  atomic = true,
  relevant = 'all',
  className = 'sr-only' 
}: AriaStatusProps) {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Enhanced Button Component with ARIA support
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  description?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  description,
  pressed,
  expanded,
  controls,
  disabled,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const buttonId = `btn-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = `desc-${Math.random().toString(36).substr(2, 9)}`;
  
  const variantStyles = {
    primary: 'strike-button-primary',
    secondary: 'strike-button-secondary',
    outline: 'strike-button-outline',
    ghost: 'bg-transparent hover:bg-secondary'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[40px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]'
  };

  return (
    <>
      <button
        id={buttonId}
        className={`
          ${variantStyles[variant]} 
          ${sizeStyles[size]}
          focus-visible:outline-2 
          focus-visible:outline-offset-2
          focus-visible:outline-primary-950
          disabled:opacity-50 
          disabled:cursor-not-allowed
          transition-all duration-200
          ${className}
        `}
        disabled={disabled || loading}
        aria-pressed={pressed}
        aria-expanded={expanded}
        aria-controls={controls}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span 
              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>{loadingText}</span>
          </span>
        ) : (
          children
        )}
      </button>
      
      {description && (
        <AriaDescription id={descriptionId}>
          {description}
        </AriaDescription>
      )}
    </>
  );
}

/**
 * ARIA Alert Component
 * Provides accessible alerts and notifications
 */
interface AriaAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function AriaAlert({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = ''
}: AriaAlertProps) {
  const alertId = `alert-${Math.random().toString(36).substr(2, 9)}`;
  const titleId = `title-${Math.random().toString(36).substr(2, 9)}`;
  
  const variantStyles = {
    info: 'bg-secondary border-input text-primary',
    success: 'bg-secondary border-input text-primary',
    warning: 'bg-secondary border-input text-primary',
    error: 'bg-destructive/10 border-destructive/20 text-destructive'
  };

  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div
      id={alertId}
      role="alert"
      aria-labelledby={title ? titleId : undefined}
      className={`
        border rounded-none p-4 
        ${variantStyles[variant]} 
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span aria-hidden="true" className="text-lg">
            {iconMap[variant]}
          </span>
          <div className="flex-1">
            {title && (
              <h3 id={titleId} className="font-medium mb-1">
                {title}
              </h3>
            )}
            <div>{children}</div>
          </div>
        </div>
        
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-4 p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-current rounded-none"
            aria-label="Dismiss alert"
          >
            <span aria-hidden="true" className="text-lg">×</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Accessible Form Field Component
 */
interface AccessibleFieldProps {
  children: React.ReactNode;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

export function AccessibleField({
  children,
  label,
  description,
  error,
  required = false,
  optional = false,
  className = ''
}: AccessibleFieldProps) {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `label-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = `desc-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `error-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        id={labelId}
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
        {optional && (
          <span className="text-muted-foreground ml-1 text-xs">
            (optional)
          </span>
        )}
      </label>
      
      {description && (
        <AriaDescription id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </AriaDescription>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-labelledby': labelId,
          'aria-describedby': [
            description ? descriptionId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        } as any)}
      </div>
      
      {error && (
        <AriaAlert
          variant="error"
          className="mt-2 text-sm"
        >
          <span id={errorId}>{error}</span>
        </AriaAlert>
      )}
    </div>
  );
}

/**
 * Accessible Progress Component
 */
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  description?: string;
  showPercentage?: boolean;
  className?: string;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  description,
  showPercentage = true,
  className = ''
}: AccessibleProgressProps) {
  const progressId = `progress-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `label-${Math.random().toString(36).substr(2, 9)}`;
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span id={labelId} className="text-sm font-medium">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-muted-foreground">
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      {description && (
        <AriaDescription className="text-sm text-muted-foreground">
          {description}
        </AriaDescription>
      )}
      
      <div
        role="progressbar"
        id={progressId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? labelId : undefined}
        aria-valuetext={`${percentage}% complete`}
        className="w-full bg-muted h-2 overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Custom Hook for generating accessible IDs
 */
export function useAccessibleId(prefix: string = 'accessible') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Custom Hook for managing ARIA states
 */
export function useAriaState(initialState: Record<string, string | boolean> = {}) {
  const [ariaState, setAriaState] = useState(initialState);

  const updateAriaState = useCallback((updates: Record<string, string | boolean>) => {
    setAriaState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetAriaState = useCallback(() => {
    setAriaState(initialState);
  }, [initialState]);

  return {
    ariaState,
    updateAriaState,
    resetAriaState,
  };
}