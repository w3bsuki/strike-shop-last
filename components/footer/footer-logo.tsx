import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FooterLogoProps {
  name: string;
  logo?: string;
  tagline?: string;
  className?: string;
}

export function FooterLogo({ name, logo, tagline, className }: FooterLogoProps) {
  return (
    <div className={cn('', className)}>
      <Link href="/" className="inline-block">
        {logo ? (
          <Image
            src={logo}
            alt={name}
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        ) : (
          <span className="text-lg font-bold tracking-tighter">{name}</span>
        )}
      </Link>
      {tagline && (
        <p className="text-xs text-[var(--subtle-text-color)] mt-1">{tagline}</p>
      )}
    </div>
  );
}