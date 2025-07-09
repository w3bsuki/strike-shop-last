import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export function FooterLink({ href, children, className, external = false }: FooterLinkProps) {
  const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  
  return (
    <Link
      href={href}
      className={cn(
        'text-xs hover:text-foreground text-muted-foreground transition-colors',
        'block py-2 min-h-[44px] flex items-center', // Proper touch target
        className
      )}
      {...linkProps}
    >
      {children}
    </Link>
  );
}