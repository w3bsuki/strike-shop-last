import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { i18n, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { I18nProvider } from '@/lib/i18n/i18n-provider';

interface LanguageLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}

// Generate static params for all supported locales
export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

// Generate metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  // Validate locale
  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return {
    title: dict.meta.siteTitle,
    description: dict.meta.siteDescription,
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      locale: lang,
    },
    twitter: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'en': '/en',
        'bg': '/bg',
        'uk': '/ua',
      },
    },
  };
}

export default async function LanguageLayout({
  children,
  params,
}: LanguageLayoutProps) {
  const { lang } = await params;
  // Validate locale
  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  // Load dictionary for server components
  const dictionary = await getDictionary(lang);

  return (
    <>
      {/* Provide i18n context for client components */}
      <I18nProvider locale={lang} dictionary={dictionary}>
        <div data-lang={lang} className="min-h-screen">
          {children}
        </div>
      </I18nProvider>
    </>
  );
}