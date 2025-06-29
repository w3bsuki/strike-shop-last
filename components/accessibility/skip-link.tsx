'use client';

import React, { useEffect, useState } from 'react';
import { accessibilityConfig } from '@/lib/accessibility-config';

/**
 * Enhanced Skip Link for WCAG AA compliance
 * Provides multiple skip options for better navigation
 */
interface SkipLinkProps {
  targetId?: string;
  text?: string;
}

export function SkipLink({ targetId = 'main-content', text = 'Skip to main content' }: SkipLinkProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleFocus = () => setIsVisible(true);
    const handleBlur = () => setIsVisible(false);

    const skipLink = document.getElementById('skip-to-main');
    if (skipLink) {
      skipLink.addEventListener('focus', handleFocus);
      skipLink.addEventListener('blur', handleBlur);

      return () => {
        skipLink.removeEventListener('focus', handleFocus);
        skipLink.removeEventListener('blur', handleBlur);
      };
    }
    
    return () => {};
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Set tabindex to make it focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Navigated to main content';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  return (
    <>
      <a
        id="skip-to-main"
        href={`#${targetId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-black focus:text-white focus:px-6 focus:py-3 focus:font-bold focus:text-sm focus:uppercase focus:tracking-wider focus:no-underline"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleClick(e as any);
          }
        }}
        style={{
          minHeight: accessibilityConfig.touchTargets.minimum,
          outline: isVisible ? `${accessibilityConfig.focus.outlineWidth} solid ${accessibilityConfig.colors.light.interactive.focus}` : 'none',
          outlineOffset: accessibilityConfig.focus.outlineOffset,
        }}
      >
        {text}
      </a>
      
      {/* Additional skip links for better navigation */}
      <nav
        className={`
          fixed left-0 top-16 z-[9998]
          bg-black text-white
          transform transition-transform duration-200
          ${isVisible ? 'translate-x-0' : '-translate-x-full sr-only'}
        `}
        aria-label="Skip links"
      >
        <ul className="list-none m-0 p-0">
          <li>
            <a
              href="#navigation"
              className="block px-6 py-2 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none text-sm min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                const nav = document.querySelector('[role="navigation"]');
                if (nav instanceof HTMLElement) {
                  nav.focus();
                  nav.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Skip to navigation
            </a>
          </li>
          <li>
            <a
              href="#footer"
              className="block px-6 py-2 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none text-sm min-h-[44px] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                const footer = document.querySelector('[role="contentinfo"]');
                if (footer instanceof HTMLElement) {
                  footer.focus();
                  footer.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Skip to footer
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}

/**
 * Section-specific skip links for complex pages
 */
export function SectionSkipLinks() {
  const sections = [
    { id: 'new-arrivals', label: 'New Arrivals' },
    { id: 'categories', label: 'Shop Categories' },
    { id: 'featured', label: 'Featured Products' },
    { id: 'community', label: 'Community' },
  ];

  return (
    <nav className="sr-only" aria-label="Page sections">
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            <a 
              href={`#${section.id}`}
              className="focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:z-50"
            >
              Jump to {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
