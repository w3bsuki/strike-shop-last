'use client';

import { Footer } from '@/components/footer/footer';
import { footerConfig } from '@/config/footer';
import { useToast } from '@/hooks/use-toast';

export default function FooterWrapper() {
  const { toast } = useToast();
  
  const handleNewsletterSubmit = (email: string, preferences: string[]) => {
    // Handle newsletter submission
    console.log('Newsletter submission:', { email, preferences });
    toast({
      title: 'Success',
      description: 'Thank you for subscribing!',
    });
  };

  return (
    <Footer 
      config={footerConfig} 
      onNewsletterSubmit={handleNewsletterSubmit}
    />
  );
}
