import { FooterSocial } from './footer-social';
import type { SocialLink } from '@/config/footer';
import { cn } from '@/lib/utils';

interface FooterBottomProps {
  social?: SocialLink[];
  copyright: string;
  registration?: string;
  localization?: {
    country: string;
    language: string;
  };
  className?: string;
}

export function FooterBottom({
  social,
  copyright,
  registration,
  localization,
  className,
}: FooterBottomProps) {
  return (
    <div className={cn('border-t border-subtle pt-8', className)}>
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-[var(--subtle-text-color)]">
        {localization && (
          <div className="mb-4 sm:mb-0">
            <span>Country: {localization.country}</span> |{' '}
            <span className="ml-2">Language: {localization.language}</span>
          </div>
        )}
        
        {social && social.length > 0 && (
          <FooterSocial links={social} className="mb-4 sm:mb-0" />
        )}
      </div>
      
      <div className="text-center sm:text-left text-[10px] text-gray-400 mt-4">
        <p>{copyright}</p>
        {registration && <p className="mt-0.5">{registration}</p>}
      </div>
    </div>
  );
}