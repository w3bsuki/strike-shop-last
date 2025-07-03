'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button-unified';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  element?: HTMLElement;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string;
}

/**
 * Accessibility Audit Component
 * 
 * Development tool for checking WCAG 2.1 compliance.
 * Only runs in development mode.
 */
export function AccessibilityAudit() {
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only run in development and after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isMounted) {
    return null;
  }

  const runAudit = () => {
    setIsAuditing(true);
    const foundIssues: AccessibilityIssue[] = [];

    // Check 1: Images without alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        foundIssues.push({
          id: `img-alt-${index}`,
          type: 'error',
          category: 'Images',
          message: `Image missing alt text: ${img.src}`,
          element: img as HTMLElement,
          wcagLevel: 'A',
          wcagCriteria: '1.1.1 Non-text Content',
        });
      }
    });

    // Check 2: Interactive elements without accessible names
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );
    interactiveElements.forEach((elem, index) => {
      const hasText = elem.textContent?.trim();
      const hasAriaLabel = elem.getAttribute('aria-label');
      const hasAriaLabelledBy = elem.getAttribute('aria-labelledby');
      const hasTitle = elem.getAttribute('title');

      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
        foundIssues.push({
          id: `interactive-name-${index}`,
          type: 'error',
          category: 'Interactive Elements',
          message: `Interactive element missing accessible name`,
          element: elem as HTMLElement,
          wcagLevel: 'A',
          wcagCriteria: '4.1.2 Name, Role, Value',
        });
      }
    });

    // Check 3: Touch target size
    const buttons = document.querySelectorAll('button, a, input, select, [role="button"]');
    buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        foundIssues.push({
          id: `touch-target-${index}`,
          type: 'warning',
          category: 'Touch Targets',
          message: `Touch target too small: ${rect.width}x${rect.height}px (minimum 44x44)`,
          element: button as HTMLElement,
          wcagLevel: 'AA',
          wcagCriteria: '2.5.5 Target Size',
        });
      }
    });

    // Check 4: Color contrast (simplified check)
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button');
    textElements.forEach((elem, index) => {
      const styles = window.getComputedStyle(elem);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // This is a simplified check - real contrast calculation is complex
      if (bgColor === textColor) {
        foundIssues.push({
          id: `contrast-${index}`,
          type: 'error',
          category: 'Color Contrast',
          message: `Potential contrast issue: same background and text color`,
          element: elem as HTMLElement,
          wcagLevel: 'AA',
          wcagCriteria: '1.4.3 Contrast (Minimum)',
        });
      }
    });

    // Check 5: Form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        foundIssues.push({
          id: `form-label-${index}`,
          type: 'error',
          category: 'Forms',
          message: `Form input missing label`,
          element: input as HTMLElement,
          wcagLevel: 'A',
          wcagCriteria: '3.3.2 Labels or Instructions',
        });
      }
    });

    // Check 6: Page landmarks
    const main = document.querySelector('main');
    // const nav = document.querySelector('nav');
    // const header = document.querySelector('header');

    if (!main) {
      foundIssues.push({
        id: 'landmark-main',
        type: 'warning',
        category: 'Landmarks',
        message: 'Page missing <main> landmark',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
      });
    }

    // Check 7: Focus indicators
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach((elem, index) => {
      const styles = window.getComputedStyle(elem);
      if (styles.outlineStyle === 'none' && !elem.className.includes('focus-visible')) {
        foundIssues.push({
          id: `focus-indicator-${index}`,
          type: 'info',
          category: 'Keyboard Navigation',
          message: 'Element may lack visible focus indicator',
          element: elem as HTMLElement,
          wcagLevel: 'AA',
          wcagCriteria: '2.4.7 Focus Visible',
        });
      }
    });

    setIssues(foundIssues);
    setIsAuditing(false);
  };

  const highlightElement = (element?: HTMLElement) => {
    if (!element) return;
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.outline = '3px solid red';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 3000);
  };

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-info-foreground" />;
    }
  };

  useEffect(() => {
    // Auto-run audit on mount in development, but only if mounted
    if (isMounted) {
      runAudit();
    }
  }, [isMounted]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[var(--z-notification)] bg-primary text-white p-3 shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle accessibility audit"
      >
        <AlertTriangle className="h-5 w-5" />
        {issues.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {issues.length}
          </span>
        )}
      </button>

      {/* Audit Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 max-h-[600px] bg-background border shadow-xl z-[var(--z-notification)] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Accessibility Audit</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              aria-label="Close audit panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {issues.length} potential issues
              </p>
              <Button
                size="sm"
                onClick={runAudit}
                loading={isAuditing}
                loadingText="Auditing..."
              >
                Re-run Audit
              </Button>
            </div>

            {issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>No accessibility issues detected!</p>
                <p className="text-xs mt-1">This is a basic check only.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border p-3 space-y-2 cursor-pointer hover:bg-secondary"
                    onClick={() => highlightElement(issue.element)}
                  >
                    <div className="flex items-start gap-2">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.category}</p>
                        <p className="text-xs text-muted-foreground">
                          WCAG {issue.wcagLevel} - {issue.wcagCriteria}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-secondary">
            <p className="text-xs text-muted-foreground">
              This is a basic accessibility check. For comprehensive testing, use 
              specialized tools like axe DevTools or WAVE.
            </p>
          </div>
        </div>
      )}
    </>
  );
}