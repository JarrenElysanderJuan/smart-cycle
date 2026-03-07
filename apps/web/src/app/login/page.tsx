import Link from 'next/link';

/**
 * Landing / Role Selection Page
 *
 * Entry point for the app. Users pick their role to go to the right dashboard.
 * TODO: [AUTH0] Replace this with Auth0 login redirect. After login, redirect
 *       based on the user's role from the JWT claims:
 *       - admin → /
 *       - store_manager → /store-dashboard
 *       - food_bank_coordinator → /food-bank-dashboard
 */
export default function LoginPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto text-center px-6">
        <h1 className="text-4xl font-bold mb-2">♻️ Smart Cycle</h1>
        <p className="text-[var(--color-text-muted)] text-lg mb-12">
          Smart Food Waste Prevention Platform
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Store Manager Card */}
          <Link
            href="/store-dashboard"
            className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-400/5 transition-all duration-300"
          >
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
              Store Manager
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Monitor your bins, review freshness alerts, and approve donations for pickup
            </p>
          </Link>

          {/* Food Bank Card */}
          <Link
            href="/food-bank-dashboard"
            className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-400/5 transition-all duration-300"
          >
            <div className="text-5xl mb-4">🏦</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
              Food Bank Coordinator
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Accept incoming donations, manage inventory, and coordinate pickups
            </p>
          </Link>
        </div>

        {/* Admin link */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            🔒 Admin Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
