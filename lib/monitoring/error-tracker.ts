/**
 * Error tracking service for production monitoring
 * Integrates with Sentry or similar services
 */

import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  [key: string]: any;
}

interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint?: string;
}

class ErrorTracker {
  private context: ErrorContext = {};
  private isProduction = process.env.NODE_ENV === 'production';

  setContext(context: ErrorContext) {
    this.context = { ...this.context, ...context };
  }

  private getSeverity(error: Error): ErrorReport['severity'] {
    // Determine severity based on error type and message
    if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
      return 'medium';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    if (error.message?.includes('Critical') || error.message?.includes('Fatal')) {
      return 'critical';
    }
    return 'low';
  }

  private getFingerprint(error: Error): string {
    // Create a unique fingerprint for error grouping
    const key = `${error.name}-${error.message?.split('\n')[0]}`;
    return key.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }

  captureException(error: Error | any, context?: ErrorContext) {
    try {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      const report: ErrorReport = {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
        context: { ...this.context, ...context },
        timestamp: new Date().toISOString(),
        severity: this.getSeverity(errorObj),
        fingerprint: this.getFingerprint(errorObj),
      };

      // Log the error
      logger.error(`Error captured: ${report.name}`, errorObj);

      // In production, send to error tracking service
      if (this.isProduction) {
        this.sendToService(report);
      }

      return report;
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
      return null;
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    const report: ErrorReport = {
      name: 'Message',
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      severity: level === 'error' ? 'high' : level === 'warning' ? 'medium' : 'low',
    };

    // Map warning to warn which is the actual logger method
    const logLevel = level === 'warning' ? 'warn' : level;
    
    if (logLevel in logger) {
      (logger as any)[logLevel](message);
    }

    if (this.isProduction) {
      this.sendToService(report);
    }
  }

  private async sendToService(report: ErrorReport) {
    try {
      // In production, this would send to Sentry or similar
      // For now, we'll use a generic endpoint
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        console.error('Failed to send error report:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  // React Error Boundary handler
  errorBoundaryHandler(error: Error, errorInfo: any) {
    this.captureException(error, {
      component: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  // Global error handler
  setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(new Error(event.reason), {
          type: 'unhandledrejection',
          promise: true,
        });
      });

      // Global errors
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message), {
          type: 'window.error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Convenience functions
export const captureException = (error: Error | any, context?: ErrorContext) => 
  errorTracker.captureException(error, context);

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error') => 
  errorTracker.captureMessage(message, level);

// Shopify-specific error handling
export const captureShopifyError = (operation: string, error: Error) => {
  errorTracker.captureException(error, {
    shopify: true,
    operation,
    api: 'storefront',
  });
};

// API error handling
export const captureApiError = (endpoint: string, status: number, error: Error) => {
  errorTracker.captureException(error, {
    api: true,
    endpoint,
    status,
  });
};

// Initialize global handlers
if (typeof window !== 'undefined') {
  errorTracker.setupGlobalHandlers();
}