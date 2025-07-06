import * as React from 'react';
import { cn } from '@/lib/utils';
import { layoutClasses } from '@/lib/layout/config';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  container?: boolean;
  fullWidth?: boolean;
  as?: 'section' | 'div' | 'article';
  id?: string;
}

/**
 * Unified Section Component
 * Use this for ALL page sections to ensure consistent spacing and layout
 */
export const Section = React.forwardRef<
  HTMLElement,
  SectionProps
>(({ 
  children,
  className,
  size = 'default',
  container = true,
  fullWidth = false,
  as: Component = 'section',
  id,
}, ref) => {
  return (
    <Component 
      ref={ref as any}
      id={id}
      className={cn(
        layoutClasses.section,
        fullWidth ? layoutClasses.fullWidth : '',
        className
      )}
    >
      {container && !fullWidth ? (
        <div className={layoutClasses.container}>
          {children}
        </div>
      ) : (
        children
      )}
    </Component>
  );
});

Section.displayName = 'Section';

// Section Title Component for consistent typography
interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function SectionTitle({
  children,
  className,
  as: Component = 'h2',
}: SectionTitleProps) {
  return (
    <Component className={cn(layoutClasses.sectionTitle, className)}>
      {children}
    </Component>
  );
}

// Container Component for when you need just the container
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function Container({
  children,
  className,
  as: Component = 'div',
}: ContainerProps) {
  return (
    <Component className={cn(layoutClasses.container, className)}>
      {children}
    </Component>
  );
}