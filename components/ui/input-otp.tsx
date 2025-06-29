'use client';

import * as React from 'react';
import { Dot } from 'lucide-react';
import { cn } from '@/lib/utils';

// TODO: InputOTP component disabled due to missing input-otp dependency
// Install input-otp to re-enable this component

export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  maxLength?: number;
  onComplete?: (value: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, containerClassName, maxLength = 6, onComplete, value, onChange, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)} 
        {...props}
      >
        <div className={cn('disabled:cursor-not-allowed text-center text-muted-foreground p-4 border rounded', className)}>
          InputOTP component disabled
          <br />
          Install input-otp dependency to enable
        </div>
      </div>
    );
  }
);
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center', className)} {...props} />
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        className
      )}
      {...props}
    >
      <span className="text-muted-foreground">-</span>
    </div>
  );
});
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };