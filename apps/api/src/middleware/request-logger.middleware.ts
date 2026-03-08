import type { Request, Response, NextFunction } from 'express';
import { env } from '../lib/supabase.js';

/**
 * Request logger middleware.
 *
 * Logs method, URL, status, and response time for every request.
 * In production this would pipe to a structured logging service.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 500) {
      console.error(`❌ ${logLine}`);
    } else if (res.statusCode >= 400) {
      console.warn(`⚠️ ${logLine}`);
    } else if (env.NODE_ENV === 'development') {
      console.log(`✅ ${logLine}`);
    }
  });

  next();
}
