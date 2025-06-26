import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id?: string;
  title: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  showCta?: boolean;
  variant?: 'default' | 'large' | 'compact';
}

export function SectionHeader({ 
  id,
  title, 
  ctaText = "VIEW ALL", 
  ctaHref,
  className = "",
  showCta = true,
  variant = 'default'
}: SectionHeaderProps) {
  const headerClasses = cn(
    "flex items-start sm:items-baseline justify-between gap-2 sm:gap-4",
    {
      'mb-3 sm:mb-4 md:mb-6': variant === 'default',
      'mb-4 sm:mb-6 md:mb-8': variant === 'large', 
      'mb-2 sm:mb-3 md:mb-4': variant === 'compact'
    },
    className
  );

  const titleClasses = cn(
    "font-bold uppercase tracking-wider font-typewriter leading-tight",
    {
      'text-xs sm:text-sm': variant === 'default' || variant === 'compact',
      'text-sm sm:text-base md:text-lg': variant === 'large'
    }
  );

  const ctaClasses = cn(
    "group uppercase font-typewriter hover:opacity-70 transition-opacity duration-200",
    "text-xs tracking-wider flex items-center gap-1 flex-shrink-0 self-start sm:self-baseline",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  );

  return (
    <div className={headerClasses}>
      <h2 id={id} className={titleClasses}>
        {title}
      </h2>
      {showCta && ctaHref && (
        <Link href={ctaHref} className={ctaClasses}>
          {ctaText}
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </Link>
      )}
    </div>
  );
}