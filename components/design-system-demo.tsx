/**
 * Design System Demo Component
 * Showcases the new design system tokens and utilities
 */

import React from 'react';

export function DesignSystemDemo() {
  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      {/* Typography Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Typography Scale</h2>
        <div className="space-y-4">
          <p className="text-xs">text-xs: Small labels and captions</p>
          <p className="text-sm">text-sm: Body text and buttons</p>
          <p className="text-base">text-base: Default body text</p>
          <p className="text-lg">text-lg: Emphasized text</p>
          <p className="text-xl">text-xl: Small headings</p>
          <p className="text-2xl">text-2xl: Section headings</p>
          <p className="text-3xl">text-3xl: Page headings</p>
          <p className="text-4xl">text-4xl: Hero headings</p>
        </div>
        
        <div className="space-y-4 border-t border-strike-gray-200 pt-6">
          <h3 className="text-xl font-semibold">Strike Typography</h3>
          <p className="text-strike-xs">STRIKE XS - UPPERCASE LABELS</p>
          <p className="text-strike-sm">STRIKE SM - NAVIGATION</p>
          <p className="text-strike-base">Strike Base - Product Titles</p>
          <p className="text-strike-lg">Strike Large - Emphasized</p>
        </div>
      </section>

      {/* Spacing Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Spacing System</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map((space) => (
            <div key={space} className="flex items-center gap-4">
              <span className="text-sm font-mono w-20">space-{space}</span>
              <div className={`h-8 bg-strike-black`} style={{ width: `${space * 0.25}rem` }} />
              <span className="text-xs text-strike-gray-600">{space * 4}px</span>
            </div>
          ))}
        </div>
      </section>

      {/* Color Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Color System</h2>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Gray Scale</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
              <div key={shade} className="space-y-2">
                <div 
                  className={`h-20 w-full border border-strike-gray-300`}
                  style={{ backgroundColor: `var(--color-strike-gray-${shade})` }}
                />
                <p className="text-xs font-mono">{shade}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Semantic Colors</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['error', 'warning', 'success', 'info'].map((color) => (
              <div key={color} className="space-y-2">
                <div 
                  className="h-20 w-full border border-strike-gray-300"
                  style={{ backgroundColor: `var(--color-${color})` }}
                />
                <p className="text-sm font-mono capitalize">{color}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Component Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Components</h2>
        
        <div className="space-y-8">
          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-strike-black text-strike-white text-strike-sm min-h-[32px]">
                Small Button
              </button>
              <button className="px-6 py-2.5 bg-strike-black text-strike-white text-strike-sm min-h-[40px]">
                Default Button
              </button>
              <button className="px-8 py-3 bg-strike-black text-strike-white text-strike-base min-h-[48px]">
                Large Button
              </button>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-2.5 border border-strike-black text-strike-black text-strike-sm min-h-[40px]">
                Outline Button
              </button>
              <button className="px-6 py-2.5 bg-strike-gray-100 text-strike-black text-strike-sm min-h-[40px]">
                Secondary Button
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Form Inputs</h3>
            <div className="max-w-md space-y-4">
              <input 
                type="text" 
                placeholder="Default input"
                className="w-full px-3 py-2 border border-strike-gray-300 text-base min-h-[40px] focus:outline-none focus:border-strike-black"
              />
              <input 
                type="text" 
                placeholder="Small input"
                className="w-full px-3 py-1.5 border border-strike-gray-300 text-sm min-h-[32px] focus:outline-none focus:border-strike-black"
              />
              <input 
                type="text" 
                placeholder="Large input"
                className="w-full px-4 py-2.5 border border-strike-gray-300 text-lg min-h-[48px] focus:outline-none focus:border-strike-black"
              />
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Cards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border border-strike-gray-200 space-y-3">
                <h4 className="text-lg font-semibold">Card Title</h4>
                <p className="text-sm text-strike-gray-600">
                  This is a card component using the design system spacing and colors.
                </p>
                <button className="text-strike-sm">LEARN MORE</button>
              </div>
              <div className="p-6 border border-strike-gray-200 bg-strike-gray-50 space-y-4">
                <h4 className="text-xl font-semibold">Featured Card</h4>
                <p className="text-base">
                  A card with more padding and a subtle background color.
                </p>
                <button className="px-4 py-2 bg-strike-black text-strike-white text-strike-sm">
                  ACTION
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Touch Targets Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Touch Targets</h2>
        <div className="space-y-4">
          <p className="text-base text-strike-gray-600">
            All interactive elements meet minimum 44px touch target requirements
          </p>
          <div className="flex flex-wrap gap-4 items-start">
            <button className="p-3 bg-strike-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="text-2xl">❤️</span>
            </button>
            <button className="px-6 py-2.5 bg-strike-black text-strike-white text-strike-sm min-h-[44px]">
              44px Height
            </button>
            <button className="p-3 border border-strike-black min-h-[48px] min-w-[48px] flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </button>
            <button className="px-8 py-3 bg-strike-black text-strike-white text-strike-base min-h-[48px]">
              48px Comfortable
            </button>
          </div>
        </div>
      </section>

      {/* Responsive Demo */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Responsive Typography</h2>
        <p className="text-base text-strike-gray-600">
          All text sizes use CSS clamp() for smooth scaling between breakpoints
        </p>
        <div className="p-6 border border-strike-gray-200 bg-strike-gray-50">
          <h3 className="text-4xl font-bold mb-4">Resize your browser</h3>
          <p className="text-lg mb-2">
            This text smoothly scales between viewport sizes.
          </p>
          <p className="text-base">
            No jarring jumps at breakpoints - just fluid, responsive typography.
          </p>
        </div>
      </section>
    </div>
  );
}