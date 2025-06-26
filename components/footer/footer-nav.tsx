import { FooterLink } from './footer-link';
import type { FooterLink as FooterLinkType } from '@/config/footer';
import { cn } from '@/lib/utils';

interface FooterNavProps {
  links: FooterLinkType[];
  className?: string;
}

export function FooterNav({ links, className }: FooterNavProps) {
  return (
    <nav>
      <ul className={cn('space-y-1.5 text-xs', className)}>
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}