import Link from 'next/link';
import type { SocialLink } from '@/config/footer';
import { cn } from '@/lib/utils';

interface FooterSocialProps {
  links: SocialLink[];
  className?: string;
}

export function FooterSocial({ links, className }: FooterSocialProps) {
  return (
    <div className={cn('flex space-x-4', className)}>
      {links.map((social) => {
        const Icon = social.icon;
        return (
          <Link
            key={social.label}
            href={social.href}
            aria-label={social.label}
            className="hover:text-foreground transition-colors text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </div>
  );
}