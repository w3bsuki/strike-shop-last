export interface DividerConfig {
  id: string;
  type: 'marquee' | 'static' | 'line' | 'icon';
  text?: string;
  theme?: 'default' | 'inverted' | 'muted' | 'transparent' | 'gradient';
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  speed?: 'slow' | 'default' | 'fast';
  direction?: 'left' | 'right';
  separator?: string;
  icon?: string;
  animation?: 'none' | 'spin' | 'pulse' | 'bounce';
}

export const dividerConfigs: Record<string, DividerConfig> = {
  'luxury-streetwear': {
    id: 'luxury-streetwear',
    type: 'marquee',
    text: 'LUXURY STREETWEAR',
    theme: 'default',
    size: 'default',
    speed: 'default',
    direction: 'left',
  },
  'premium-quality': {
    id: 'premium-quality',
    type: 'marquee',
    text: 'PREMIUM QUALITY',
    theme: 'default',
    size: 'default',
    speed: 'default',
    direction: 'left',
  },
  'next-generation': {
    id: 'next-generation',
    type: 'marquee',
    text: 'NEXT GENERATION',
    theme: 'default',
    size: 'default',
    speed: 'default',
    direction: 'left',
  },
  'strike-brand': {
    id: 'strike-brand',
    type: 'marquee',
    text: 'STRIKE™',
    theme: 'default',
    size: 'default',
    speed: 'slow',
    direction: 'left',
    separator: '•',
  },
  'simple-line': {
    id: 'simple-line',
    type: 'line',
    theme: 'default',
    size: 'default',
  },
  'dotted-line': {
    id: 'dotted-line',
    type: 'line',
    theme: 'muted',
    size: 'sm',
  },
  'icon-divider': {
    id: 'icon-divider',
    type: 'icon',
    theme: 'default',
    size: 'default',
    animation: 'pulse',
  },
};

// Helper functions
export function getDividerConfig(id: string): DividerConfig | undefined {
  return dividerConfigs[id];
}

export function getDividersByType(type: DividerConfig['type']): DividerConfig[] {
  return Object.values(dividerConfigs).filter(divider => divider.type === type);
}