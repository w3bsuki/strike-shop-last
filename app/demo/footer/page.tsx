'use client';

import { Footer } from '@/components/footer/footer';
import { footerConfig, minimalFooterConfig, compactFooterConfig } from '@/config/footer';
import { toast } from 'sonner';

export default function FooterDemoPage() {
  const handleNewsletterSubmit = (email: string, preferences: string[]) => {
    toast.success(`Subscribed: ${email}`, {
      description: preferences.length > 0 ? `Preferences: ${preferences.join(', ')}` : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <h1 className="text-4xl font-bold text-center mb-12">Footer Component Showcase</h1>
        
        {/* Default Footer */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Default Footer</h2>
          <div className="border rounded-lg overflow-hidden">
            <Footer
              config={footerConfig}
              onNewsletterSubmit={handleNewsletterSubmit}
            />
          </div>
        </section>

        {/* Minimal Footer */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Minimal Footer</h2>
          <div className="border rounded-lg overflow-hidden">
            <Footer
              config={minimalFooterConfig}
              variant="minimal"
              onNewsletterSubmit={handleNewsletterSubmit}
            />
          </div>
        </section>

        {/* Compact Footer */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Compact Footer</h2>
          <div className="border rounded-lg overflow-hidden">
            <Footer
              config={compactFooterConfig}
              variant="compact"
              onNewsletterSubmit={handleNewsletterSubmit}
            />
          </div>
        </section>

        {/* Custom Configuration Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Custom Configuration</h2>
          <div className="border rounded-lg overflow-hidden">
            <Footer
              config={{
                sections: [
                  {
                    title: 'Products',
                    links: [
                      { label: 'New Arrivals', href: '/new' },
                      { label: 'Best Sellers', href: '/best-sellers' },
                      { label: 'Sale', href: '/sale' },
                    ],
                  },
                  {
                    title: 'Support',
                    links: [
                      { label: 'Contact', href: '/contact' },
                      { label: 'FAQ', href: '/faq' },
                    ],
                  },
                ],
                social: footerConfig.social.slice(0, 2),
                newsletter: {
                  title: 'Stay Connected',
                  description: 'Get exclusive offers and updates.',
                  placeholder: 'Enter email',
                  preferences: [],
                },
                company: {
                  name: 'STRIKE™',
                  tagline: 'Redefining Fashion',
                },
                legal: {
                  copyright: '© 2024 STRIKE™',
                },
                localization: {
                  country: 'UK',
                  language: 'EN-GB',
                },
              }}
              onNewsletterSubmit={handleNewsletterSubmit}
            />
          </div>
        </section>
      </div>
    </div>
  );
}