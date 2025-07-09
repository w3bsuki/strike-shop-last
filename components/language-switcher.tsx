'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronDown, Globe, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { i18n, localeMetadata, type Locale, getLocaleFromPath, removeLocaleFromPath } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'compact' | 'mobile';
  className?: string;
  showFlag?: boolean;
  showLabel?: boolean;
  currentLocale: Locale;
}

export function LanguageSwitcher({
  variant = 'default',
  className,
  showFlag = true,
  showLabel = true,
  currentLocale,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (newLocale: Locale) => {
    // Remove current locale from path and add new locale
    const pathWithoutLocale = removeLocaleFromPath(pathname, currentLocale);
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    
    router.push(newPath);
    setOpen(false);
  };

  const currentLanguage = localeMetadata[currentLocale];

  const triggerContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className="flex items-center space-x-1">
            {showFlag && <span className="text-sm">{currentLanguage.flag}</span>}
            <span className="font-medium text-sm uppercase">{currentLocale}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        );
      
      case 'compact':
        return (
          <div className="flex items-center space-x-1">
            <Languages className="h-4 w-4" />
            <span className="font-medium text-sm uppercase">{currentLocale}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        );
      
      case 'mobile':
        return (
          <div className="flex items-center space-x-1">
            <span className="text-sm">{currentLanguage.flag}</span>
            <span className="font-medium text-sm uppercase">{currentLocale}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        );
      
      default:
        return (
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            {showFlag && <span>{currentLanguage.flag}</span>}
            <span className="font-medium">{currentLanguage.nativeName}</span>
            {showLabel && (
              <span className="hidden sm:inline text-muted-foreground text-sm">
                ({currentLocale.toUpperCase()})
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        );
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' || variant === 'mobile' ? 'sm' : 'default'}
          className={cn(
            'h-auto p-2',
            variant === 'compact' && 'h-8 px-2',
            variant === 'mobile' && 'h-8 px-3',
            className
          )}
        >
          {triggerContent()}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center">
          <Languages className="mr-2 h-4 w-4" />
          Language / Мова / Език
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {i18n.locales.map((locale) => {
          const language = localeMetadata[locale];
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{language.nativeName}</span>
                  <span className="text-sm text-muted-foreground">
                    {language.name} ({locale.toUpperCase()})
                  </span>
                </div>
              </div>
              {currentLocale === locale && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="text-center">
            Automatically adapts currency and region
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile/tight spaces
export function LanguageSwitcherCompact(props: Omit<LanguageSwitcherProps, 'variant'>) {
  return <LanguageSwitcher {...props} variant="compact" />;
}

// Minimal version for headers
export function LanguageSwitcherMinimal(props: Omit<LanguageSwitcherProps, 'variant'>) {
  return <LanguageSwitcher {...props} variant="minimal" />;
}

// Combined Language + Currency switcher
interface CombinedSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export function CombinedLanguageCurrencySwitcher({ 
  currentLocale, 
  className 
}: CombinedSwitcherProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <LanguageSwitcherMinimal 
        currentLocale={currentLocale} 
        showFlag={true}
        showLabel={false}
      />
    </div>
  );
}