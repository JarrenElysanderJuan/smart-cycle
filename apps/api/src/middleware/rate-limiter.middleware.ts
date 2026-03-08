import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter.
 *
 * Limits requests per IP address within a sliding time window.
 * For production, consider using Redis-backed rate limiting (e.g., `rate-limiter-flexible`).
 *
 * @param windowMs   Time window in milliseconds
 * @param maxRequests Maximum requests per window per IP
 */
export function rateLimiter(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
): (req: Request, res: Response, next: NextFunction) => void {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits) {
      if (value.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, 60_000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();

    const entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        error: 'Too many requests',
        retry_after_seconds: retryAfter,
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - entry.count);
    next();
  };
}

/**
 * Stricter rate limiter specifically for telemetry ingestion.
 * Bins report every 2 hours, so a generous limit of 50/15min per IP.
 */
export const telemetryRateLimiter = rateLimiter(15 * 60 * 1000, 50);

/**
 * Standard API rate limiter (100 requests per 15 minutes per IP).
 */
export const apiRateLimiter = rateLimiter(15 * 60 * 1000, 100);
