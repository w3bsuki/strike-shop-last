/**
 * Sentry integration for error tracking and performance monitoring
 * Mock implementation - Sentry is not installed
 */

import { logger } from './logger';

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
type CaptureContext = Record<string, any>;

// Sentry configuration
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENVIRONMENT === 'production';

// Mock Sentry implementation
export function initSentry() {
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }
  
  logger.info('Mock Sentry initialized', {
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT
  });
}

// Capture exception
export function captureException(error: Error | string, context?: CaptureContext): string {
  const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.error('Mock Sentry: Exception captured', {
    errorId,
    error: error instanceof Error ? error.message : error,
    context
  });
  
  return errorId;
}

// Capture message
export function captureMessage(message: string, level: SeverityLevel = 'info', context?: CaptureContext): string {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (level === 'error') {
    logger.error('Mock Sentry: Message captured', {
      messageId,
      message,
      level,
      context
    });
  } else {
    logger.info('Mock Sentry: Message captured', {
      messageId,
      message,
      level,
      context
    });
  }
  
  return messageId;
}

// Start transaction
export function startTransaction(name: string, op: string): MockTransaction {
  return new MockTransaction(name, op);
}

// Measure async operation
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  options?: { op?: string; tags?: Record<string, string> }
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    logger.debug('Mock Sentry: Async operation measured', {
      name,
      duration,
      op: options?.op,
      tags: options?.tags
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('Mock Sentry: Async operation failed', {
      name,
      duration,
      op: options?.op,
      tags: options?.tags,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

// Set user context
export function setUser(user: { id?: string; email?: string; username?: string } | null): void {
  logger.info('Mock Sentry: User context set', { user });
}

// Set tags
export function setTags(tags: Record<string, string>): void {
  logger.info('Mock Sentry: Tags set', { tags });
}

// Set context
export function setContext(key: string, context: Record<string, any>): void {
  logger.info('Mock Sentry: Context set', { key, context });
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: SeverityLevel;
  type?: string;
  data?: Record<string, any>;
}): void {
  logger.debug('Mock Sentry: Breadcrumb added', breadcrumb);
}

// Profiler
export class Profiler {
  private transactions: Map<string, MockTransaction> = new Map();
  
  startTransaction(name: string, op: string): MockTransaction {
    const transaction = new MockTransaction(name, op);
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }
  
  getActiveTransactions(): MockTransaction[] {
    return Array.from(this.transactions.values()).filter(t => !t.finished);
  }
}

// Mock Transaction class
class MockTransaction {
  id: string;
  name: string;
  op: string;
  startTime: number;
  endTime?: number;
  finished: boolean = false;
  spans: MockSpan[] = [];
  
  constructor(name: string, op: string) {
    this.id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.op = op;
    this.startTime = Date.now();
  }
  
  setTag(key: string, value: string): this {
    logger.debug('Mock Transaction: Tag set', { transactionId: this.id, key, value });
    return this;
  }
  
  setData(key: string, value: any): this {
    logger.debug('Mock Transaction: Data set', { transactionId: this.id, key, value });
    return this;
  }
  
  startChild(op: string, description?: string): MockSpan {
    const span = new MockSpan(op, description);
    this.spans.push(span);
    return span;
  }
  
  finish(): void {
    if (this.finished) return;
    
    this.endTime = Date.now();
    this.finished = true;
    const duration = this.endTime - this.startTime;
    
    logger.info('Mock Transaction finished', {
      id: this.id,
      name: this.name,
      op: this.op,
      duration,
      spanCount: this.spans.length
    });
  }
}

// Mock Span class
class MockSpan {
  id: string;
  op: string;
  description?: string;
  startTime: number;
  endTime?: number;
  finished: boolean = false;
  
  constructor(op: string, description?: string) {
    this.id = `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.op = op;
    this.description = description;
    this.startTime = Date.now();
  }
  
  setTag(key: string, value: string): this {
    logger.debug('Mock Span: Tag set', { spanId: this.id, key, value });
    return this;
  }
  
  setData(key: string, value: any): this {
    logger.debug('Mock Span: Data set', { spanId: this.id, key, value });
    return this;
  }
  
  finish(): void {
    if (this.finished) return;
    
    this.endTime = Date.now();
    this.finished = true;
    const duration = this.endTime - this.startTime;
    
    logger.debug('Mock Span finished', {
      id: this.id,
      op: this.op,
      description: this.description,
      duration
    });
  }
}

// Export profiler instance
export const profiler = new Profiler();

// Error monitoring helpers
export function monitorAPIError(endpoint: string, error: Error, context?: Record<string, any>): void {
  captureException(error, {
    ...context,
    endpoint,
    type: 'api_error'
  });
}

export function monitorShopifyError(operation: string, error: Error, context?: Record<string, any>): void {
  captureException(error, {
    ...context,
    operation,
    type: 'shopify_error'
  });
}

// Performance monitoring helpers  
export function measureAPICall(endpoint: string): MockTransaction {
  return startTransaction(`api.${endpoint}`, 'http.server');
}

export function measureDatabaseQuery(query: string): MockSpan {
  const transaction = profiler.getActiveTransactions()[0];
  if (transaction) {
    return transaction.startChild('db.query', query);
  }
  return new MockSpan('db.query', query);
}