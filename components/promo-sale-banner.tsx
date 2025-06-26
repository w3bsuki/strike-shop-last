'use client';

import { useMemo } from 'react';
import {
  PromoSection,
  PromoContent,
  PromoTitle,
  PromoDescription,
  PromoCountdown,
  PromoBadge,
  PromoBackground,
} from '@/components/promo';
import type { PromoConfig } from '@/config/promos';

interface PromoSaleBannerProps {
  config: PromoConfig;
}

export function PromoSaleBanner({ config }: PromoSaleBannerProps) {
  const hasDiscount = useMemo(() => !!config.discount, [config.discount]);

  return (
    <PromoSection 
      href={config.link} 
      theme={config.theme} 
      size={config.size} 
      className="group cursor-pointer"
    >
      <PromoContent layout={config.layout}>
        {/* Text Content */}
        <div>
          <PromoTitle size={config.size} color={config.theme === 'inverted' ? 'black' : 'white'}>
            {config.title}
          </PromoTitle>
          {config.subtitle && (
            <PromoDescription 
              size={config.size} 
              opacity="default" 
              color={config.theme === 'inverted' ? 'black' : 'white'}
            >
              {config.subtitle}
            </PromoDescription>
          )}
          {config.description && (
            <PromoDescription 
              size="sm" 
              opacity="subtle" 
              color={config.theme === 'inverted' ? 'black' : 'white'}
            >
              {config.description}
            </PromoDescription>
          )}
          {config.endDate && (
            <PromoCountdown
              endDate={config.endDate}
              format={hasDiscount ? 'timer' : 'date'}
              variant={hasDiscount ? 'timer' : 'default'}
              color={config.theme === 'inverted' ? 'black' : 'white'}
            />
          )}
        </div>
        
        {/* Discount Badge */}
        {hasDiscount && config.discount && (
          <PromoBadge
            value={config.discount.value}
            unit={config.discount.unit}
            suffix={config.discount.suffix}
            size={config.size}
            variant="animated"
            color={config.theme === 'inverted' ? 'black' : 'white'}
          />
        )}
      </PromoContent>
      
      {/* Background */}
      {config.background && (
        <PromoBackground 
          pattern={config.background.pattern}
          image={config.background.image}
          gradientFrom={config.background.gradientFrom}
          gradientTo={config.background.gradientTo}
          variant={config.background.image ? 'image' : 'pattern'}
        />
      )}
    </PromoSection>
  );
}