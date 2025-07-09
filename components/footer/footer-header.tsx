import { cn } from '@/lib/utils';

interface FooterHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function FooterHeader({ children, className }: FooterHeaderProps) {
  return (
    <h3 className={cn('text-xs font-bold mb-3 uppercase tracking-wider', className)}>
      {children}
    </h3>
  );
}