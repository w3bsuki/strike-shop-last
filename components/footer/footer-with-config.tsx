import { Footer } from './footer';
import { footerConfig } from '@/config/footer';
import type { FooterConfig } from '@/config/footer';

interface FooterWithConfigProps {
  config?: FooterConfig;
  className?: string;
  variant?: 'default' | 'minimal' | 'compact';
  onNewsletterSubmit?: (email: string, preferences: string[]) => void;
}

export function FooterWithConfig({ 
  config = footerConfig, 
  ...props 
}: FooterWithConfigProps) {
  return <Footer config={config} {...props} />;
}