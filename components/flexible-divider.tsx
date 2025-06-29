'use client';

import {
  DividerSection,
  DividerLine,
  DividerText,
  DividerIcon,
  DividerMarquee,
} from '@/components/divider';
import type { DividerConfig } from '@/config/dividers';

interface FlexibleDividerProps {
  config: DividerConfig;
  className?: string;
}

export function FlexibleDivider({ config, className }: FlexibleDividerProps) {
  const renderDividerContent = () => {
    switch (config.type) {
      case 'marquee':
        return (
          <DividerMarquee
            text={config.text || ''}
            {...(config.speed && { speed: config.speed })}
            {...(config.direction && { direction: config.direction })}
            {...(config.separator && { separator: config.separator })}
            pauseOnHover
          />
        );
      
      case 'static':
        return (
          <div className="text-center">
            <DividerText
              {...(config.text && { text: config.text })}
              size={config.size === 'xl' ? 'lg' : (config.size as any)}
              color={config.theme === 'inverted' ? 'black' : 'white'}
            />
          </div>
        );
      
      case 'line':
        return (
          <DividerLine
            variant="solid"
            color={config.theme === 'inverted' ? 'black' : 'white'}
            spacing="none"
          />
        );
      
      case 'icon':
        return (
          <div className="flex items-center justify-center">
            <DividerLine
              variant="solid"
              color={config.theme === 'inverted' ? 'black' : 'white'}
              spacing="none"
              className="flex-1"
            />
            <DividerIcon
              size={config.size}
              color={config.theme === 'inverted' ? 'black' : 'white'}
              animation={config.animation}
            />
            <DividerLine
              variant="solid"
              color={config.theme === 'inverted' ? 'black' : 'white'}
              spacing="none"
              className="flex-1"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <DividerSection 
      theme={config.theme} 
      size={config.size} 
      className={className}
    >
      {renderDividerContent()}
    </DividerSection>
  );
}