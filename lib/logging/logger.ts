/**
 * 2025 Production Logging - Pino + Structured
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Simple, clean API
export const log = {
  info: (message: string, data?: object) => logger.info(data, message),
  error: (message: string, error?: Error | object) => logger.error(error, message),
  warn: (message: string, data?: object) => logger.warn(data, message),
  debug: (message: string, data?: object) => logger.debug(data, message),
};