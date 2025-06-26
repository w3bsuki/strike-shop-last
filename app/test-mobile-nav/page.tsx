'use client';

import { useState } from 'react';
import MobileNav from '@/components/mobile/navigation/mobile-nav';

export default function TestMobileNavPage() {
  const [variant, setVariant] = useState<'default' | 'minimal' | 'floating'>('default');
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simulate content with safe area visualization */}
      <div className="fixed inset-0 pointer-events-none z-50 border-4 border-red-500" style={{
        borderTopWidth: 'env(safe-area-inset-top)',
        borderRightWidth: 'env(safe-area-inset-right)',
        borderBottomWidth: 'env(safe-area-inset-bottom)',
        borderLeftWidth: 'env(safe-area-inset-left)',
      }}>
        <div className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded pointer-events-auto">
          Safe Area Boundaries (Red)
        </div>
      </div>

      {/* Test controls */}
      <div className="p-4 pt-safe-4 space-y-4">
        <h1 className="text-2xl font-bold">Mobile Navigation Test</h1>
        
        <div className="space-y-2">
          <label className="block font-medium">Variant:</label>
          <div className="space-x-2">
            <button
              onClick={() => setVariant('default')}
              className={`px-4 py-2 rounded ${variant === 'default' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              Default
            </button>
            <button
              onClick={() => setVariant('minimal')}
              className={`px-4 py-2 rounded ${variant === 'minimal' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              Minimal
            </button>
            <button
              onClick={() => setVariant('floating')}
              className={`px-4 py-2 rounded ${variant === 'floating' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              Floating
            </button>
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

        <div className="mt-8 p-4 bg-white rounded shadow">
          <h2 className="font-bold mb-2">Implementation Details:</h2>
          <ul className="space-y-1 text-sm">
            <li>✅ Hide-on-scroll: Hides when scrolling down > 100px, shows when scrolling up</li>
            <li>✅ Throttled scroll handler (100ms)</li>
            <li>✅ Smooth transitions (300ms)</li>
            <li>✅ Safe area padding using env(safe-area-inset-*)</li>
            <li>✅ Minimum 44x44px touch targets</li>
            <li>✅ Icon size increased to 24x24px (h-6 w-6)</li>
            <li>✅ Haptic feedback on tap (if supported)</li>
            <li>✅ Landscape orientation support</li>
          </ul>
        </div>
      </div>

      {/* Long scrollable content to test hide-on-scroll */}
      <div className="p-4 space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="font-medium mb-2">Scroll down to test hide-on-scroll behavior</p>
          <p className="text-sm text-gray-600">The navigation will hide when you scroll down more than 100px and reappear when you scroll up.</p>
        </div>
        
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="bg-white p-4 rounded shadow">
            <h3 className="font-medium">Content Block {i + 1}</h3>
            <p className="text-sm text-gray-600 mt-1">
              This is a test content block to enable scrolling and test the hide-on-scroll functionality.
            </p>
          </div>
        ))}
      </div>

      {/* Add padding to account for mobile nav */}
      <div className="h-20 lg:hidden" />

      {/* Mobile Navigation */}
      <MobileNav variant={variant} showLabels={showLabels} showThreshold={0.1} />
    </div>
  );
}