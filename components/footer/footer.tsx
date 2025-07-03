// Server Component - CVE-2025-29927 Compliant Performance Optimization
// Phase 3: Hybrid Component Optimization - Server footer + Client newsletter
import { FooterSection } from './footer-section';
import { FooterNewsletter } from './footer-newsletter';
import { FooterBottom } from './footer-bottom';
import { FooterLogo } from './footer-logo';
import type { FooterConfig } from '@/config/footer';
import { cn } from '@/lib/utils';

interface FooterProps {
  config: FooterConfig;
  className?: string;
  variant?: 'default' | 'minimal' | 'compact';
  onNewsletterSubmit?: (email: string, preferences: string[]) => void;
}

export function Footer({
  config,
  className,
  variant = 'default',
  onNewsletterSubmit,
}: FooterProps) {
  const showNewsletter = variant !== 'compact' && config.newsletter.title;
  const showSections = variant !== 'compact' && config.sections.length > 0;

  return (
    <footer className={cn('bg-background section-padding border-t border-border pb-safe-8 px-safe', className)}>
      <div className="strike-container">
        {variant === 'compact' ? (
          // Compact footer layout
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <FooterLogo {...config.company} />
            <FooterBottom
              social={config.social}
              copyright={config.legal.copyright}
              {...(config.legal.registration && { registration: config.legal.registration })}
              localization={config.localization}
              className="border-t-0 pt-0"
            />
          </div>
        ) : (
          <>
            {/* Logo section for minimal variant */}
            {variant === 'minimal' && (
              <div className="mb-8">
                <FooterLogo {...config.company} />
              </div>
            )}

            {/* Main content grid */}
            <div className={cn(
              'grid gap-8 mb-12',
              variant === 'minimal'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            )}>
              {/* Newsletter section */}
              {showNewsletter && (
                <FooterNewsletter
                  title={config.newsletter.title}
                  description={config.newsletter.description}
                  placeholder={config.newsletter.placeholder}
                  preferences={config.newsletter.preferences}
                  {...(onNewsletterSubmit && { onSubmit: onNewsletterSubmit })}
                />
              )}

              {/* Footer sections */}
              {showSections &&
                config.sections.map((section) => (
                  <FooterSection
                    key={section.title}
                    title={section.title}
                    links={section.links}
                  />
                ))}
            </div>

            {/* Bottom section */}
            <FooterBottom
              social={config.social}
              copyright={config.legal.copyright}
              {...(config.legal.registration && { registration: config.legal.registration })}
              localization={config.localization}
            />
          </>
        )}
      </div>
    </footer>
  );
}