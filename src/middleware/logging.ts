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

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to log when response is sent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.end = function (chunk?: any, encoding?: any, callback?: any): any {
      // Restore original end
      res.end = originalEnd;

      // Calculate duration
      const duration = Date.now() - startTime;

      // Log completed request
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

      // Call original end
      return originalEnd.call(this, chunk, encoding, callback);
    };

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
