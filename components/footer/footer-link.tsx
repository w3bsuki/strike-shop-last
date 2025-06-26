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
        'text-xs hover:text-black text-[var(--subtle-text-color)] transition-colors',
        className
      )}
      {...linkProps}
    >
      {children}
    </Link>
  );
}