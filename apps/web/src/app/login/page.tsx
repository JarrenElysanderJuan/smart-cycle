import { redirect } from 'next/navigation';
import { getUserClaims } from '@/lib/auth';

/**
 * Login / Landing Page
 *
 * If already authenticated, redirect to the appropriate dashboard.
 * If not, show login button.
 */
export default async function LoginPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  // If already logged in, redirect based on role
  if (claims) {
    if (claims.role === 'admin') redirect('/admin');
    if (claims.role === 'store_manager') redirect('/store-dashboard');
    if (claims.role === 'food_bank_coordinator') redirect('/food-bank-dashboard');
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-md mx-auto text-center px-6">
        <h1 className="text-4xl font-bold mb-2">♻️ Smart Cycle</h1>
        <p className="text-[var(--color-text-muted)] text-lg mb-12">
          Smart Food Waste Prevention Platform
        </p>

        <LoginButton />

        <p className="text-xs text-[var(--color-text-muted)] mt-8">
          You will be redirected to your dashboard after login
        </p>
      </div>
    </div>
  );
}

function LoginButton() {
  // Using a regular <a> tag is fine here since this is a full-page render (not client-side nav)
  return (
    <a
      href="/auth/login"
      className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all duration-300 shadow-lg shadow-[var(--color-primary)]/20"
    >
      🔐 Sign In with Auth0
    </a>
  );
}
