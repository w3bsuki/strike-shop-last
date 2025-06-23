'use client';

import React, { useEffect, useState } from 'react';
import { useColorContrast, useThemeValidation } from './color-contrast-system';

/**
 * Accessibility Testing Utilities
 * Development tools for testing and validating WCAG 2.1 AA compliance
 */

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'contrast' | 'focus' | 'aria' | 'keyboard' | 'semantic' | 'structure';
  element?: string;
  message: string;
  recommendation?: string;
  wcagCriterion?: string;
}

export function AccessibilityTestPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const { validationResults, runValidation } = useThemeValidation();

  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Listen for keyboard shortcut to toggle panel (Ctrl/Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    if (isDevelopment) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDevelopment]);

  const runFullAccessibilityAudit = async () => {
    setIsScanning(true);
    const detectedIssues: AccessibilityIssue[] = [];

    try {
      // 1. Check color contrast
      await runValidation();
      validationResults.forEach(result => {
        if (!result.contrast.isAccessible) {
          detectedIssues.push({
            type: 'error',
            category: 'contrast',
            element: result.element,
            message: `Color contrast ratio ${result.contrast.ratio}:1 fails WCAG AA requirements`,
            recommendation: result.contrast.recommendation,
            wcagCriterion: '1.4.3 Contrast (Minimum)'
          });
        }
      });

      // 2. Check for missing alt attributes
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.hasAttribute('aria-hidden')) {
          detectedIssues.push({
            type: 'error',
            category: 'semantic',
            element: `img[${index}]`,
            message: 'Image missing alt attribute',
            recommendation: 'Add descriptive alt text or aria-hidden="true" for decorative images',
            wcagCriterion: '1.1.1 Non-text Content'
          });
        }
      });

      // 3. Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (index === 0 && level !== 1) {
          detectedIssues.push({
            type: 'warning',
            category: 'structure',
            element: heading.tagName.toLowerCase(),
            message: 'Page should start with h1',
            recommendation: 'Use h1 as the main page heading',
            wcagCriterion: '2.4.6 Headings and Labels'
          });
        } else if (level > previousLevel + 1) {
          detectedIssues.push({
            type: 'warning',
            category: 'structure',
            element: heading.tagName.toLowerCase(),
            message: `Heading level skipped (h${previousLevel} to h${level})`,
            recommendation: 'Use sequential heading levels',
            wcagCriterion: '2.4.6 Headings and Labels'
          });
        }
        previousLevel = level;
      });

      // 4. Check for keyboard accessibility
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
      interactiveElements.forEach((element, index) => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex && parseInt(tabIndex) > 0) {
          detectedIssues.push({
            type: 'warning',
            category: 'keyboard',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            message: 'Positive tabindex detected',
            recommendation: 'Use tabindex="0" or remove tabindex to maintain natural tab order',
            wcagCriterion: '2.4.3 Focus Order'
          });
        }
      });

      // 5. Check for missing form labels
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach((input, index) => {
        const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel) {
          detectedIssues.push({
            type: 'error',
            category: 'aria',
            element: `${input.tagName.toLowerCase()}[${index}]`,
            message: 'Form control missing label',
            recommendation: 'Add a label element or aria-label attribute',
            wcagCriterion: '3.3.2 Labels or Instructions'
          });
        }
      });

      // 6. Check for ARIA attributes
      const elementsWithAria = document.querySelectorAll('[aria-expanded], [aria-checked], [aria-selected]');
      elementsWithAria.forEach((element, index) => {
        const expanded = element.getAttribute('aria-expanded');
        const checked = element.getAttribute('aria-checked');
        const selected = element.getAttribute('aria-selected');

        if (expanded && !['true', 'false'].includes(expanded)) {
          detectedIssues.push({
            type: 'error',
            category: 'aria',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            message: 'Invalid aria-expanded value',
            recommendation: 'Use "true" or "false" for aria-expanded',
            wcagCriterion: '4.1.2 Name, Role, Value'
          });
        }

        if (checked && !['true', 'false', 'mixed'].includes(checked)) {
          detectedIssues.push({
            type: 'error',
            category: 'aria',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            message: 'Invalid aria-checked value',
            recommendation: 'Use "true", "false", or "mixed" for aria-checked',
            wcagCriterion: '4.1.2 Name, Role, Value'
          });
        }
      });

      // 7. Check for minimum touch targets
      const touchTargets = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
      touchTargets.forEach((target, index) => {
        const rect = target.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          detectedIssues.push({
            type: 'warning',
            category: 'focus',
            element: `${target.tagName.toLowerCase()}[${index}]`,
            message: `Touch target too small (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
            recommendation: 'Ensure interactive elements are at least 44x44 pixels',
            wcagCriterion: '2.5.5 Target Size (Enhanced)'
          });
        }
      });

      setIssues(detectedIssues);
    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  if (!isDevelopment || !isVisible) {
    return null;
  }

  const errorCount = issues.filter(issue => issue.type === 'error').length;
  const warningCount = issues.filter(issue => issue.type === 'warning').length;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border-2 border-gray-300 shadow-lg z-[9999] overflow-hidden flex flex-col">
      <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
        <h3 className="font-bold text-sm">Accessibility Audit</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
          aria-label="Close accessibility panel"
        >
          ×
        </button>
      </div>

      <div className="p-3 border-b">
        <button
          onClick={runFullAccessibilityAudit}
          disabled={isScanning}
          className="w-full bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isScanning ? 'Scanning...' : 'Run Accessibility Audit'}
        </button>
      </div>

      {issues.length > 0 && (
        <div className="p-3 border-b bg-gray-50">
          <div className="text-sm">
            <span className="font-medium">Results: </span>
            <span className="text-red-600">{errorCount} errors</span>
            {errorCount > 0 && warningCount > 0 && ', '}
            <span className="text-yellow-600">{warningCount} warnings</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">
            No issues found. Run audit to check accessibility.
          </div>
        ) : (
          <div className="divide-y">
            {issues.map((issue, index) => (
              <div key={index} className="p-3">
                <div className="flex items-start gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium flex-shrink-0 ${
                      issue.type === 'error'
                        ? 'bg-red-100 text-red-800'
                        : issue.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {issue.type.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{issue.message}</div>
                    {issue.element && (
                      <div className="text-xs text-gray-500 mt-1">
                        Element: {issue.element}
                      </div>
                    )}
                    {issue.wcagCriterion && (
                      <div className="text-xs text-gray-500 mt-1">
                        WCAG: {issue.wcagCriterion}
                      </div>
                    )}
                    {issue.recommendation && (
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Fix:</strong> {issue.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-50 border-t">
        <div className="text-xs text-gray-500 text-center">
          Press Ctrl+Shift+A to toggle this panel
        </div>
      </div>
    </div>
  );
}

/**
 * Focus Debugging Component
 * Visualizes focus order and keyboard navigation
 */
export function FocusDebugger() {
  const [isActive, setIsActive] = useState(false);
  const [focusOrder, setFocusOrder] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const focusableElements = Array.from(
      document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => {
      const element = el as HTMLElement;
      return element.offsetParent !== null && !element.hidden;
    }) as HTMLElement[];

    setFocusOrder(focusableElements);

    // Add visual indicators
    focusableElements.forEach((el, index) => {
      const indicator = document.createElement('div');
      indicator.textContent = (index + 1).toString();
      indicator.className = 'focus-debug-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        background: red;
        color: white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        pointer-events: none;
      `;
      
      el.style.position = 'relative';
      el.appendChild(indicator);
    });

    return () => {
      // Clean up indicators
      document.querySelectorAll('.focus-debug-indicator').forEach(el => el.remove());
    };
  }, [isActive]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border p-4 shadow-lg z-[9999]">
      <h4 className="font-bold mb-2">Focus Debugger</h4>
      <button
        onClick={() => setIsActive(!isActive)}
        className={`px-3 py-1 text-sm ${
          isActive ? 'bg-red-500 text-white' : 'bg-gray-200'
        }`}
      >
        {isActive ? 'Hide Focus Order' : 'Show Focus Order'}
      </button>
      
      {isActive && (
        <div className="mt-2 text-xs">
          Found {focusOrder.length} focusable elements
        </div>
      )}
    </div>
  );
}

/**
 * Screen Reader Announcement Debugger
 * Shows screen reader announcements visually
 */
export function ScreenReaderDebugger() {
  const [announcements, setAnnouncements] = useState<Array<{
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Monitor ARIA live regions for changes
    const liveRegions = document.querySelectorAll('[aria-live]');
    
    const observers: MutationObserver[] = [];

    liveRegions.forEach(region => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const text = (mutation.target as Element).textContent?.trim();
            if (text) {
              const priority = (mutation.target as Element).getAttribute('aria-live') as 'polite' | 'assertive';
              setAnnouncements(prev => [
                ...prev.slice(-4), // Keep only last 5 announcements
                {
                  message: text,
                  priority: priority || 'polite',
                  timestamp: new Date()
                }
              ]);
            }
          }
        });
      });

      observer.observe(region, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      observers.push(observer);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  if (process.env.NODE_ENV !== 'development' || announcements.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-white border shadow-lg z-[9999] max-h-60 overflow-y-auto">
      <div className="bg-gray-100 p-2 border-b">
        <h4 className="font-bold text-sm">Screen Reader Announcements</h4>
      </div>
      
      <div className="divide-y max-h-48 overflow-y-auto">
        {announcements.map((announcement, index) => (
          <div key={index} className="p-2">
            <div className="flex justify-between items-start">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  announcement.priority === 'assertive'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {announcement.priority}
              </span>
              <span className="text-xs text-gray-500">
                {announcement.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm mt-1">{announcement.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Color Contrast Live Checker
 * Shows real-time color contrast information
 */
export function ColorContrastChecker() {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { checkContrast } = useColorContrast();

  useEffect(() => {
    if (!isActive) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedElement(e.target as HTMLElement);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isActive]);

  const getElementContrast = (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      // Find parent with background
      let parent = element.parentElement;
      while (parent) {
        const parentStyles = window.getComputedStyle(parent);
        if (parentStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && parentStyles.backgroundColor !== 'transparent') {
          return checkContrast(color, parentStyles.backgroundColor);
        }
        parent = parent.parentElement;
      }
      return checkContrast(color, '#ffffff'); // Default to white
    }
    
    return checkContrast(color, backgroundColor);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const contrast = selectedElement ? getElementContrast(selectedElement) : null;

  return (
    <div className="fixed top-20 right-4 bg-white border p-4 shadow-lg z-[9999] w-64">
      <h4 className="font-bold mb-2">Color Contrast Checker</h4>
      
      <button
        onClick={() => setIsActive(!isActive)}
        className={`px-3 py-1 text-sm w-full mb-3 ${
          isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        {isActive ? 'Click an element to check' : 'Activate Checker'}
      </button>

      {selectedElement && contrast && (
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Element:</strong> {selectedElement.tagName.toLowerCase()}
          </div>
          
          <div className="text-sm">
            <strong>Contrast:</strong> {contrast.ratio}:1
          </div>
          
          <div className={`text-sm p-2 rounded ${
            contrast.isAccessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {contrast.isAccessible ? `✓ WCAG ${contrast.level}` : '✗ Fails WCAG AA'}
          </div>
          
          {contrast.recommendation && (
            <div className="text-xs text-gray-600">
              {contrast.recommendation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}