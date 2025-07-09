'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FooterHeader } from './footer-header';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n/i18n-provider';

interface FooterNewsletterProps {
  title: string;
  description: string;
  placeholder: string;
  preferences?: string[];
  className?: string;
  onSubmit?: (email: string, preferences: string[]) => void;
}

export function FooterNewsletter({
  title,
  description,
  placeholder,
  preferences = [],
  className,
  onSubmit,
}: FooterNewsletterProps) {
  const [email, setEmail] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const { toast } = useToast();
  const t = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Handle newsletter submission internally
      console.log('Newsletter submission:', { email, selectedPreferences });
      
      // Show success toast
      toast({
        title: t('common.success'),
        description: t('home.subscribeSuccess'),
      });
      
      // Call external handler if provided (for legacy compatibility)
      if (onSubmit) {
        onSubmit(email, selectedPreferences);
      }
      
      // Reset form
      setEmail('');
      setSelectedPreferences([]);
    }
  };

  const togglePreference = (preference: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
  };

  return (
    <div className={cn('md:col-span-2 lg:col-span-1', className)}>
      <FooterHeader>{title}</FooterHeader>
      <p className="text-xs text-[var(--subtle-text-color)] mb-4">{description}</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex">
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="footer-input flex-grow h-12 rounded-none"
            autoComplete="email"
            enterKeyHint="done"
            required
          />
          <Button
            type="submit"
            className="button-primary ml-2 min-h-touch px-4 rounded-none"
          >
            →
          </Button>
        </div>
        
        {preferences.length > 0 && (
          <div className="space-y-1.5">
            {preferences.map((pref) => (
              <div key={pref} className="flex items-center">
                <Checkbox
                  id={`footer-${pref.toLowerCase()}`}
                  checked={selectedPreferences.includes(pref)}
                  onCheckedChange={() => togglePreference(pref)}
                  className="min-h-touch min-w-touch"
                />
                <label
                  htmlFor={`footer-${pref.toLowerCase()}`}
                  className="ml-2 text-[10px] text-[var(--subtle-text-color)] cursor-pointer"
                >
                  {pref}
                </label>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}