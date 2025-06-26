'use client';

import { Footer } from '@/components/footer/footer';
import { footerConfig } from '@/config/footer';
import { toast } from 'sonner';

export default function FooterWrapper() {
  const handleNewsletterSubmit = (email: string, preferences: string[]) => {
    // Handle newsletter submission
    console.log('Newsletter submission:', { email, preferences });
    toast.success('Thank you for subscribing!');
  };

  return (
    <Footer 
      config={footerConfig} 
      onNewsletterSubmit={handleNewsletterSubmit}
    />
  );
}
