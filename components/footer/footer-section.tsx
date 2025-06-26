import { FooterHeader } from './footer-header';
import { FooterNav } from './footer-nav';
import type { FooterSection as FooterSectionType } from '@/config/footer';
import { cn } from '@/lib/utils';

interface FooterSectionProps extends FooterSectionType {
  className?: string;
}

export function FooterSection({ title, links, className }: FooterSectionProps) {
  return (
    <div className={cn(className)}>
      <FooterHeader>{title}</FooterHeader>
      <FooterNav links={links} />
    </div>
  );
}