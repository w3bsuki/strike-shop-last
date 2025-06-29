'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalContext } from './modal-context';

// Modal Root Component
interface ModalProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Modal({ children, open, defaultOpen, onOpenChange }: ModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);
  
  return (
    <ModalContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </DialogPrimitive.Root>
    </ModalContext.Provider>
  );
}

// Modal Trigger
export const ModalTrigger = DialogPrimitive.Trigger;

// Modal Portal
export const ModalPortal = DialogPrimitive.Portal;

// Modal Close
export const ModalClose = DialogPrimitive.Close;

// Modal Overlay
export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    style={{ zIndex: 'var(--z-modal-backdrop)' }}
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

// Modal Content
interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;
  onInteractOutside?: (event: Event) => void;
}

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, children, showCloseButton = true, onInteractOutside, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      {...(onInteractOutside && { onInteractOutside })}
      className={cn(
        'fixed left-[50%] top-[50%]',
        'w-full max-w-lg',
        'translate-x-[-50%] translate-y-[-50%]',
        'bg-background shadow-xl',
        'duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      style={{ zIndex: 'var(--z-modal)' }}
      {...props}
    >
      {children}
      {showCloseButton && (
        <ModalClose className="absolute right-4 top-4 z-10 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </ModalClose>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = 'ModalContent';

// Modal Header
export const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

// Modal Title
export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

// Modal Description
export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
ModalDescription.displayName = 'ModalDescription';

// Modal Body
export const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex-1 overflow-y-auto',
      className
    )}
    {...props}
  />
));
ModalBody.displayName = 'ModalBody';

// Modal Footer
export const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';