import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  showCta?: boolean;
  variant?: 'default' | 'large' | 'compact';
}

export function SectionHeader({ 
  title, 
  ctaText = "VIEW ALL", 
  ctaHref,
  className = "",
  showCta = true,
  variant = 'default'
}: SectionHeaderProps) {
  const headerClasses = cn(
    "flex items-baseline justify-between",
    {
      'mb-4 md:mb-6': variant === 'default',
      'mb-6 md:mb-8': variant === 'large', 
      'mb-3 md:mb-4': variant === 'compact'
    },
    className
  );

  const titleClasses = cn(
    "font-bold uppercase tracking-wider font-typewriter",
    {
      'text-xs': variant === 'default' || variant === 'compact',
      'text-sm md:text-base': variant === 'large'
    }
  );

  const ctaClasses = cn(
    "group uppercase font-typewriter hover:opacity-70 transition-opacity duration-200",
    "text-xs tracking-wider flex items-center gap-1",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  );

  return (
    <div className={headerClasses}>
      <h2 className={titleClasses}>
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