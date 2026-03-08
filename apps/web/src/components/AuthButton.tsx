'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * Auth button: shows Login or user avatar + Logout.
 *
 * Uses window.location.href for login/logout to force full-page navigation
 * (prevents Next.js RSC-fetch which would fail CORS on Auth0 redirect).
 */
export default function AuthButton(): React.ReactElement {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-[var(--color-surface-elevated)] animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={() => { window.location.href = '/auth/login'; }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer"
      >
        🔐 Log In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name ?? 'User'}
            className="h-8 w-8 rounded-full border border-[var(--color-border)]"
          />
        )}
        <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
      </div>
      <button
        onClick={() => { window.location.href = '/auth/logout'; }}
        className="text-xs text-[var(--color-text-muted)] hover:text-red-400 transition-colors cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
