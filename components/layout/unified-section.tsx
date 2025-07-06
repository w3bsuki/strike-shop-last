import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { SPACING, layoutClasses } from '@/lib/layout/config';

// Proper container breakout using modern Tailwind techniques
const breakoutClasses = "w-dvw relative left-1/2 -translate-x-1/2 max-w-none";

// Background variant configurations
const backgroundVariants = cva("", {
  variants: {
    color: {
      none: "",
      light: "bg-gray-50",
      dark: "bg-gray-900 text-white",
      accent: "bg-gray-100",
      black: "bg-black text-white",
      white: "bg-white",
      custom: "", // For custom backgrounds
    },
  },
  defaultVariants: {
    color: "none",
  },
});

// PERFECT SPACING - All sections use IDENTICAL spacing (no variations!)
const perfectSectionSpacing = SPACING.section.vertical;

// PERFECT CONTAINERS - All containers use IDENTICAL padding
const containerVariants = cva("mx-auto", {
  variants: {
    width: {
      full: "w-full",
      container: layoutClasses.container,
      contained: layoutClasses.containerWide,
      narrow: layoutClasses.containerNarrow,
    },
  },
  defaultVariants: {
    width: "container",
  },
});

// Base section props
interface BaseSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

// Type A: Hero Section - Full-width background with contained content
interface HeroSectionProps extends BaseSectionProps, VariantProps<typeof backgroundVariants> {
  pattern?: React.ReactNode; // For background patterns
  containerWidth?: VariantProps<typeof containerVariants>['width'];
}

export function HeroSection({ 
  children, 
  className, 
  color = "none",
  pattern,
  containerWidth = "container",
  id 
}: HeroSectionProps) {
  return (
    <section 
      id={id}
      className={cn(
        "relative w-full",
        perfectSectionSpacing, // PERFECT SPACING - always the same
        backgroundVariants({ color }),
        className
      )}
    >
      {pattern && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          {pattern}
        </div>
      )}
      <div className={cn("relative", containerVariants({ width: containerWidth }))}>
        {children}
      </div>
    </section>
  );
}

// Type B: Showcase Section - Full-width background with edge-to-edge products
interface ShowcaseSectionProps extends BaseSectionProps, VariantProps<typeof backgroundVariants> {
  header?: React.ReactNode;
  pattern?: React.ReactNode;
}

export function ShowcaseSection({ 
  children, 
  className, 
  color = "none",
  header,
  pattern,
  id 
}: ShowcaseSectionProps) {
  return (
    <section 
      id={id}
      className={cn(
        "relative w-full overflow-hidden", // Add overflow-hidden
        backgroundVariants({ color }),
        className
      )}
    >
      {pattern && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          {pattern}
        </div>
      )}
      
      {header && (
        <div className={cn(
          "relative flex items-center",
          "px-4 sm:px-4 lg:px-6 max-w-[1440px] mx-auto", // Custom padding for header
          "py-4 sm:py-6 md:py-12" // Tighter mobile padding
        )}>
          {header}
        </div>
      )}
      
      <div className={cn(
        "relative w-full", // Ensure full width
        "pb-3 md:pb-8"
      )}>
        {children}
      </div>
    </section>
  );
}

// Type C: Content Section - Contained background and content
interface ContentSectionProps extends BaseSectionProps, VariantProps<typeof backgroundVariants> {
  containerWidth?: VariantProps<typeof containerVariants>['width'];
}

export function ContentSection({ 
  children, 
  className, 
  color = "none",
  containerWidth = "container",
  id 
}: ContentSectionProps) {
  return (
    <section 
      id={id}
      className={cn(
        "relative w-full",
        perfectSectionSpacing, // PERFECT SPACING - always the same
        className
      )}
    >
      <div className={cn(
        containerVariants({ width: containerWidth }),
        backgroundVariants({ color }),
        "rounded-lg" // Optional: add subtle rounding for contained sections
      )}>
        {children}
      </div>
    </section>
  );
}

// Full-width breakout utility for breaking out of containers
interface BreakoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Breakout({ children, className }: BreakoutProps) {
  return (
    <div className={cn(breakoutClasses, className)}>
      {children}
    </div>
  );
}

// Header component for showcase sections
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  pattern?: React.ReactNode;
  theme?: "light" | "dark";
  className?: string;
}

export function SectionHeader({ 
  title, 
  description, 
  action, 
  pattern,
  theme = "light", 
  className 
}: SectionHeaderProps) {
  return (
    <div className={cn("relative", className)}>
      {pattern && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          {pattern}
        </div>
      )}
      
      <div className="relative flex items-center justify-between gap-4 w-full min-h-[80px] md:min-h-[100px]">
        <div className="flex flex-col justify-center">
          <h2 className={cn(
            "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-typewriter font-bold uppercase tracking-wider",
            theme === "dark" ? "text-white" : "text-black"
          )}>
            {title}
          </h2>
          {description && (
            <p className={cn(
              "text-xs sm:text-sm mt-1",
              theme === "dark" ? "text-white/70" : "text-black/70"
            )}>
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center">
          {action}
        </div>
      </div>
    </div>
  );
}

// Strike brand pattern component
export function StrikePattern({ theme = "light" }: { theme?: "light" | "dark" }) {
  const color = theme === "dark" ? "white" : "black";
  
  return (
    <div 
      className="w-full h-full" 
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, ${color} 35px, ${color} 70px)`,
      }} 
    />
  );
}