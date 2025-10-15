import type { Request, Response, NextFunction } from 'express';
import type { Logger } from '../utils/logger.js';

/**
 * Express middleware for logging HTTP requests and responses
 * Tracks request duration, status codes, and user agents
 */
export function requestLoggingMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Log incoming request
    logger.info(
      {
        event: 'request_start',
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      },
      `Request received: ${req.method} ${req.path}`
    );

    // Log when response is finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      logger.info(
        {
          event: 'request_complete',
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: duration,
        },
        `Request completed: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    });

    next();
  };
}

/**
 * Error logging middleware for Express
 * Should be added after all other middleware and routes
 */
export function errorLoggingMiddleware(logger: Logger) {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    logger.error(
      {
        event: 'request_error',
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        method: req.method,
        path: req.path,
        query: req.query,
      },
      `Request error: ${req.method} ${req.path} - ${err.message}`
    );

    next(err);
  };
}
