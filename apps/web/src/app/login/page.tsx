import { redirect } from 'next/navigation';
import { getUserClaims } from '@/lib/auth';

/**
 * Login — Split layout with oversized type on left
 */
export default async function LoginPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  if (claims) {
    if (claims.role === 'admin') redirect('/admin');
    if (claims.role === 'store_manager') redirect('/store-dashboard');
    if (claims.role === 'food_bank_coordinator') redirect('/food-bank-dashboard');
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Big editorial statement */}
      <div className="hidden md:flex md:w-[55%] bg-[var(--color-primary)] p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Large decorative number */}
        <span className="absolute -right-10 -top-16 font-[family-name:var(--font-display)] text-[20rem] leading-none text-white/[0.04] select-none pointer-events-none">
          ♻
        </span>

        <div>
          <span className="text-lg font-bold text-white">Smart Cycle</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,4.5vw,4.5rem)] text-white leading-[1.05] mb-8">
            Reducing food
            <br />waste, one bin
            <br />at a time
          </h1>
          <p className="text-white/60 text-base max-w-sm leading-relaxed">
            Smart bins monitor freshness in real-time and automatically
            connect stores with food banks when donations are ready.
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <span className="font-[family-name:var(--font-display)] text-3xl text-white">7</span>
            <p className="text-white/50 text-xs mt-1">stage lifecycle</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <span className="font-[family-name:var(--font-display)] text-3xl text-white">3</span>
            <p className="text-white/50 text-xs mt-1">dashboard roles</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <span className="font-[family-name:var(--font-display)] text-3xl text-white">24/7</span>
            <p className="text-white/50 text-xs mt-1">IoT monitoring</p>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-bg)]">
        <div className="max-w-sm w-full">
          <div className="md:hidden mb-8">
            <span className="text-lg font-bold text-[var(--color-text)]">♻️ Smart Cycle</span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-2">Welcome back</h2>
          <p className="text-[var(--color-text-muted)] mb-10">
            Sign in to access your dashboard
          </p>

          <a
            href="/auth/login"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-lg text-base font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Sign In with Auth0
          </a>

          <p className="text-xs text-[var(--color-text-light)] mt-6 text-center">
            You&apos;ll be redirected to your dashboard after login
          </p>
        </div>
      </div>
    </div>
  );
}
