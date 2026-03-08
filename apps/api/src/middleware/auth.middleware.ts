import { auth, type InsufficientScopeError } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../lib/supabase.js';

/**
 * Custom claims namespace — must match the Auth0 Post-Login Action.
 */
const CLAIMS_NAMESPACE = 'https://smart-cycle.com';

/**
 * JWT validation middleware.
 * Verifies the Access Token against Auth0's JWKS endpoint.
 *
 * After this middleware runs, `req.auth.payload` contains the decoded JWT.
 */
export const checkJwt = auth({
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  audience: env.AUTH0_AUDIENCE,
});

/**
 * Extract Smart Cycle custom claims from the validated JWT.
 * Must be used AFTER `checkJwt`.
 */
export interface SmartCycleClaims {
  sub: string;          // Auth0 user ID (e.g. "auth0|abc123")
  role: string;         // "admin" | "store_manager" | "food_bank_coordinator"
  storeId: string | null;
  foodBankId: string | null;
  organizationId: string | null;
}

export function extractClaims(req: Request): SmartCycleClaims {
  const payload = (req as unknown as { auth: { payload: Record<string, unknown> } }).auth.payload;
  return {
    sub: payload.sub as string,
    role: (payload[`${CLAIMS_NAMESPACE}/role`] as string) ?? 'store_manager',
    storeId: (payload[`${CLAIMS_NAMESPACE}/store_id`] as string) ?? null,
    foodBankId: (payload[`${CLAIMS_NAMESPACE}/food_bank_id`] as string) ?? null,
    organizationId: (payload[`${CLAIMS_NAMESPACE}/organization_id`] as string) ?? null,
  };
}

/**
 * Middleware factory: require a specific role.
 * Returns 403 if the authenticated user doesn't have the required role.
 *
 * Usage: `router.post('/approve', checkJwt, requireRole('store_manager'), handler)`
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const claims = extractClaims(req);
    if (!allowedRoles.includes(claims.role)) {
      res.status(403).json({
        error: `Forbidden: requires role [${allowedRoles.join(' | ')}], got '${claims.role}'`,
      });
      return;
    }
    next();
  };
}

/**
 * Error handler for auth failures — returns clean JSON instead of HTML.
 */
export function authErrorHandler(
  err: Error | InsufficientScopeError,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if ('status' in err && typeof (err as { status: number }).status === 'number') {
    const status = (err as { status: number }).status;
    res.status(status).json({
      error: status === 401 ? 'Unauthorized: missing or invalid token' : 'Forbidden',
    });
    return;
  }
  next(err);
}
