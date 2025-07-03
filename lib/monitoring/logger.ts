/**
 * Production-ready logging system with structured logging
 * Following DevOps best practices for observability
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration?: number;
    memory?: number;
  };
}

class Logger {
  private context: LogContext = {};
  private isProduction = process.env.NODE_ENV === 'production';

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
    };

    if (data instanceof Error) {
      entry.error = {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    } else if (data) {
      entry.context = { ...entry.context, ...data };
    }

    return entry;
  }

  private output(entry: LogEntry) {
    if (this.isProduction) {
      // In production, output structured JSON logs
      console.log(JSON.stringify(entry));
    } else {
      // In development, use pretty printing
      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
        fatal: '\x1b[35m', // magenta
      }[entry.level];
      
      const reset = '\x1b[0m';
      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`);
      
      if (entry.context && Object.keys(entry.context).length > 0) {
        console.log('Context:', entry.context);
      }
      
      if (entry.error) {
        console.error('Error:', entry.error);
      }
    }
  }

  debug(message: string, data?: any) {
    if (this.isProduction) return; // Skip debug logs in production
    this.output(this.formatLog('debug', message, data));
  }

  info(message: string, data?: any) {
    this.output(this.formatLog('info', message, data));
  }

  warn(message: string, data?: any) {
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, error?: Error | any) {
    this.output(this.formatLog('error', message, error));
  }

  fatal(message: string, error?: Error | any) {
    this.output(this.formatLog('fatal', message, error));
  }

  // Performance logging
  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.info(`Performance: ${label}`, {
        performance: { duration: Math.round(duration * 100) / 100 },
      });
    };
  }

  // API logging middleware
  apiMiddleware(request: Request, response: Response, duration: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: response.ok ? 'info' : 'error',
      message: `${request.method} ${new URL(request.url).pathname}`,
      context: {
        ...this.context,
        method: request.method,
        url: request.url,
        status: response.status,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
      performance: { duration },
    };

    this.output(entry);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, error?: Error | any) => logger.error(message, error);
export const logFatal = (message: string, error?: Error | any) => logger.fatal(message, error);

// Shopify-specific logging helpers
export const logShopifyRequest = (operation: string, variables?: any) => {
  logger.info(`Shopify GraphQL: ${operation}`, { shopify: { operation, variables } });
};

export const logShopifyError = (operation: string, error: Error) => {
  logger.error(`Shopify GraphQL Error: ${operation}`, error);
};

// Performance monitoring helpers
export const measurePerformance = async <T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> => {
  const endTimer = logger.startTimer(label);
  try {
    const result = await fn();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
};