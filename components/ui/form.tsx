'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// TODO: Form components disabled due to missing react-hook-form dependency
// Install react-hook-form to re-enable this component

// Placeholder types for compatibility
export type FieldPath = string;
export type FieldValues = Record<string, any>;

// Simplified form context
const FormFieldContext = React.createContext<{ name?: string }>({});

// Placeholder FormProvider
export const Form = ({ children, ...props }: any) => (
  <form {...props}>
    {children}
  </form>
);

export interface FormFieldProps {
  name: string;
  children: React.ReactNode;
}

export const FormField = ({ name, children }: FormFieldProps) => (
  <FormFieldContext.Provider value={{ name }}>
    {children}
  </FormFieldContext.Provider>
);

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    );
  }
);
FormItem.displayName = 'FormItem';

export interface FormLabelProps 
  extends React.ComponentPropsWithoutRef<typeof Label> {}

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormLabelProps
>(({ className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn('font-medium', className)}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return <Comp {...props} ref={ref} />;
  }
);
FormControl.displayName = 'FormControl';

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {children}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

// Placeholder hook
export const useFormField = () => ({
  invalid: false,
  isDirty: false,
  isTouched: false,
  isValidating: false,
  error: undefined,
  id: '',
  name: '',
  formItemId: '',
  formDescriptionId: '',
  formMessageId: '',
});