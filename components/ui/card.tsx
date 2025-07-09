import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const cardVariants = cva(
  'border bg-card text-card-foreground',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        strike: 'border-2 border-foreground shadow-lg hover:shadow-xl transition-shadow',
        featured: 'border-2 border-primary bg-primary/5 shadow-md',
        compact: 'border border-border shadow-none',
      },
      padding: {
        none: '',
        sm: 'p-spacing-2',
        default: 'p-card',
        lg: 'p-spacing-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

export interface UICardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, UICardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-spacing-1',
      !noPadding && 'p-card',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && 'p-card pt-spacing-0',
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center',
      !noPadding && 'p-card pt-spacing-0',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
