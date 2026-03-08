import { auth0 } from '@/lib/auth';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware for Auth0 v4.
 * Automatically handles /auth/login, /auth/callback, /auth/logout, /auth/profile.
 */
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Auth0 auth routes
    '/auth/:path*',
  ],
};
