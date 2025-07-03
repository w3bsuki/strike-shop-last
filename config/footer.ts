import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface FooterConfig {
  sections: FooterSection[];
  social: SocialLink[];
  newsletter: {
    title: string;
    description: string;
    placeholder: string;
    preferences: string[];
  };
  company: {
    name: string;
    logo?: string;
    tagline?: string;
  };
  legal: {
    copyright: string;
    registration?: string;
  };
  localization: {
    country: string;
    language: string;
  };
}

export const footerConfig: FooterConfig = {
  sections: [
    {
      title: 'HELP',
      links: [
        { label: 'FAQ', href: '/faq' },
        { label: 'Shipping & Returns', href: '/shipping' },
        { label: 'Order Tracking', href: '/account/orders' },
        { label: 'Size Guide', href: '/size-guide' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
    {
      title: 'LEGAL AREA',
      links: [
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Cookie Policy', href: '/privacy#cookies' },
        { label: 'Accessibility', href: '/accessibility' },
      ],
    },
    {
      title: 'COMPANY',
      links: [
        { label: 'About Strike™', href: '/about-strike' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
        { label: 'Sustainability', href: '/sustainability' },
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
    title: 'JOIN THE STRIKE™ COMMUNITY',
    description: 'Sign up for 10% off your first order & updates on new arrivals, promotions and events.',
    placeholder: 'Your Email',
    preferences: ['Womenswear', 'Menswear', 'Kids'],
  },
  company: {
    name: 'Strike™',
    tagline: 'Premium Streetwear',
  },
  legal: {
    copyright: `Copyright © ${new Date().getFullYear()} Strike™ LLC. All Rights Reserved.`,
    registration: 'Licensee: Strike 17 S.r.l. Registered Office: 123 Fashion Avenue, New York, NY. Company Reg: 12345678901',
  },
  localization: {
    country: 'United States',
    language: 'EN',
  },
};

// Alternative footer layouts
export const minimalFooterConfig: FooterConfig = {
  sections: [
    {
      title: 'Quick Links',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
      ],
    },
  ],
  social: footerConfig.social,
  newsletter: {
    title: 'Stay Updated',
    description: 'Get the latest news and updates.',
    placeholder: 'Enter your email',
    preferences: [],
  },
  company: footerConfig.company,
  legal: {
    copyright: footerConfig.legal.copyright,
  },
  localization: footerConfig.localization,
};

export const compactFooterConfig: FooterConfig = {
  sections: [],
  social: footerConfig.social,
  newsletter: {
    title: '',
    description: '',
    placeholder: '',
    preferences: [],
  },
  company: footerConfig.company,
  legal: {
    copyright: footerConfig.legal.copyright,
  },
  localization: footerConfig.localization,
};