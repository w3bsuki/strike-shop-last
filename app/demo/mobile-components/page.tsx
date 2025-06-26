'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import MobileNav from '@/components/mobile/navigation/mobile-nav';

export default function MobileComponentsDemo() {
  const [variant, setVariant] = useState<'default' | 'minimal' | 'floating'>('default');
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test controls */}
      <div className="p-4 pt-safe-4 space-y-4">
        <h1 className="text-2xl font-bold">Mobile Navigation Demo</h1>
        
        <div className="space-y-2">
          <label className="block font-medium">Variant:</label>
          <div className="space-x-2">
            <Button
              onClick={() => setVariant('default')}
              variant={variant === 'default' ? 'default' : 'outline'}
              size="sm"
            >
              Default
            </Button>
            <Button
              onClick={() => setVariant('minimal')}
              variant={variant === 'minimal' ? 'default' : 'outline'}
              size="sm"
            >
              Minimal
            </Button>
            <Button
              onClick={() => setVariant('floating')}
              variant={variant === 'floating' ? 'default' : 'outline'}
              size="sm"
            >
              Floating
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium">Show Labels</span>
          </label>
        </div>
      </div>

      {/* Long scrollable content */}
      <div className="p-4 space-y-4">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="bg-white p-4 rounded shadow">
            <h3 className="font-medium">Content Block {i + 1}</h3>
            <p className="text-sm text-gray-600 mt-1">
              This is test content to enable scrolling and test the mobile navigation.
            </p>
          </div>
        ))}
      </div>

      <div className="h-20 lg:hidden" />

      <MobileNav variant={variant} showLabels={showLabels} showThreshold={0.1} />
    </div>
  );
}