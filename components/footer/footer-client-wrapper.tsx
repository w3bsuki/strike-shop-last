'use client';

import { useTranslations } from '@/lib/i18n/i18n-provider';
import { Footer } from './footer';
import type { FooterConfig } from '@/config/footer';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function FooterClientWrapper() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const footerConfig: FooterConfig = {
    sections: [
      {
        title: t('footer.help'),
        links: [
          { label: t('footer.faq'), href: '/faq' },
          { label: t('footer.shippingReturns'), href: '/shipping' },
          { label: t('footer.orderTracking'), href: '/account/orders' },
          { label: t('footer.sizeGuide'), href: '/size-guide' },
          { label: t('footer.contactUs'), href: '/contact' },
        ],
      },
      {
        title: t('footer.legalArea'),
        links: [
          { label: t('footer.termsConditions'), href: '/terms' },
          { label: t('footer.privacyPolicy'), href: '/privacy' },
          { label: t('footer.cookiePolicy'), href: '/privacy#cookies' },
          { label: t('footer.accessibility'), href: '/accessibility' },
        ],
      },
      {
        title: t('footer.company'),
        links: [
          { label: t('footer.aboutStrike'), href: '/about-strike' },
          { label: t('footer.careers'), href: '/careers' },
          { label: t('footer.press'), href: '/press' },
          { label: t('footer.sustainability'), href: '/sustainability' },
        ],
      },
    ],
    social: [
      { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
      { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
      { label: 'Twitter', href: 'https://twitter.com', icon: Twitter },
      { label: 'Youtube', href: 'https://youtube.com', icon: Youtube },
    ],
    newsletter: {
      title: t('footer.joinCommunity'),
      description: t('footer.newsletterDescription'),
      placeholder: t('footer.newsletterPlaceholder'),
      preferences: [t('footer.womenswear'), t('footer.menswear'), t('footer.kids')],
    },
    company: {
      name: 'Strike™',
      tagline: 'Premium Streetwear',
    },
    legal: {
      copyright: t('footer.copyright').replace('{year}', currentYear.toString()),
      registration: t('footer.registration'),
    },
    localization: {
      country: 'United States',
      language: 'EN',
    },
  };

  return <Footer config={footerConfig} />;
}