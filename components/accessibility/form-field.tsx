import React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AccessibleFormFieldProps {
  id: string
  label: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactElement
  className?: string
}

/**
 * Accessible Form Field Wrapper
 * Provides proper labeling, error messages, and ARIA attributes
 */
export function AccessibleFormField({
  id,
  label,
  error,
  description,
  required = false,
  children,
  className = ""
}: AccessibleFormFieldProps) {
  const describedBy = [
    description && `${id}-description`,
    error && `${id}-error`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>
      
      {description && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': describedBy || undefined,
        'aria-required': required,
      })}

      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Accessible Checkbox/Radio Group
 */
interface AccessibleGroupProps {
  legend: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function AccessibleFieldGroup({
  legend,
  error,
  description,
  required = false,
  children,
  className = ""
}: AccessibleGroupProps) {
  const groupId = React.useId()
  const describedBy = [
    description && `${groupId}-description`,
    error && `${groupId}-error`
  ].filter(Boolean).join(' ')

  return (
    <fieldset
      className={cn("space-y-3", className)}
      aria-describedby={describedBy || undefined}
      aria-required={required}
      aria-invalid={error ? 'true' : 'false'}
    >
      <legend className="text-sm font-medium">
        {legend}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </legend>

      {description && (
        <p id={`${groupId}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      <div className="space-y-2">
        {children}
      </div>

      {error && (
        <p id={`${groupId}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/**
 * Screen Reader Only Text
 */
export function VisuallyHidden({ 
  children,
  as: Component = 'span' 
}: { 
  children: React.ReactNode
  as?: React.ElementType
}) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  )
}