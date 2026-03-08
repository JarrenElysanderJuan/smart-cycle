import Link from 'next/link';
import { getUserClaims } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Landing Page
 *
 * Public-facing hero page for Smart Cycle.
 * If already logged in, redirects to the appropriate dashboard.
 */
export default async function LandingPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  if (claims) {
    if (claims.role === 'admin') redirect('/admin');
    if (claims.role === 'store_manager') redirect('/store-dashboard');
    if (claims.role === 'food_bank_coordinator') redirect('/food-bank-dashboard');
    // Authenticated but no role assigned — send to onboarding
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">♻️</span>
            <span className="text-lg font-bold">Smart Cycle</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/auth/login"
              className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Log In
            </a>
            <a
              href="/auth/login"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-8">
            🌱 B2B Food Waste Prevention
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Turn Food Waste Into
            <span className="text-[var(--color-primary)]"> Community Impact</span>
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12">
            Smart Cycle connects grocery stores with local food banks using IoT smart bins.
            Monitor freshness in real-time, automate donations, and reduce waste — all from one platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/auth/login"
              className="px-8 py-3.5 rounded-2xl text-base font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              Start Free →
            </a>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-2xl text-base font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-[var(--color-text-muted)] text-center mb-16 max-w-xl mx-auto">
            From bin sensor to food bank pickup — fully automated in 7 steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              step="01"
              icon="🗑️"
              title="Smart Bin Monitoring"
              description="IoT sensors track temperature, gas levels, and weight in real-time to assess food freshness."
              color="emerald"
            />
            <StepCard
              step="02"
              icon="🔔"
              title="Automated Alerts"
              description="When freshness drops, an alert is sent to the store manager for donation approval."
              color="amber"
            />
            <StepCard
              step="03"
              icon="🚚"
              title="Smart Routing"
              description="Approved donations are automatically routed to the nearest food bank with available capacity."
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Built for Every Role</h2>
          <p className="text-[var(--color-text-muted)] text-center mb-16 max-w-xl mx-auto">
            Dedicated dashboards tailored to your needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              icon="🏪"
              title="Store Managers"
              features={['Monitor bin health', 'Approve donations', 'Track pickup status']}
              color="emerald"
            />
            <RoleCard
              icon="🏦"
              title="Food Bank Coordinators"
              features={['Accept incoming donations', 'Manage inventory', 'Confirm pickups']}
              color="blue"
            />
            <RoleCard
              icon="🔒"
              title="Administrators"
              features={['Full system overview', 'Manage all bins & alerts', 'Register stores & food banks']}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Reduce Waste?</h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            Join Smart Cycle and connect your stores with local food banks today.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20"
          >
            Get Started Free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>♻️ Smart Cycle — Food Waste Prevention Platform</span>
          <span>Built for B2B Hackathon 2026</span>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ step, icon, title, description, color }: {
  step: string; icon: string; title: string; description: string; color: string;
}): React.ReactElement {
  const borderColors: Record<string, string> = {
    emerald: 'hover:border-emerald-400/30',
    amber: 'hover:border-amber-400/30',
    blue: 'hover:border-blue-400/30',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors ${borderColors[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-bold ${textColors[color]}`}>{step}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{description}</p>
    </div>
  );
}

function RoleCard({ icon, title, features, color }: {
  icon: string; title: string; features: string[]; color: string;
}): React.ReactElement {
  const borderColors: Record<string, string> = {
    emerald: 'hover:border-emerald-400/30',
    blue: 'hover:border-blue-400/30',
    purple: 'hover:border-purple-400/30',
  };
  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
  };

  return (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors ${borderColors[color]}`}>
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
