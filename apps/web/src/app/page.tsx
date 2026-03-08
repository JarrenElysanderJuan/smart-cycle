import Link from 'next/link';
import { getUserClaims } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  if (claims) {
    if (claims.role === 'admin') redirect('/admin');
    if (claims.role === 'store_manager') redirect('/store-dashboard');
    if (claims.role === 'food_bank_coordinator') redirect('/food-bank-dashboard');
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Minimal nav — just logo + login */}
      <header className="fixed top-0 w-full z-50 bg-[var(--color-bg)]/95 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-[var(--color-text)]">♻️ Smart Cycle</span>
          <div className="flex items-center gap-4">
            <a href="/auth/login" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              Log In
            </a>
            <a href="/auth/login" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* HERO — Full viewport, massive type, editorial */}
      <section className="min-h-[85vh] flex flex-col justify-end px-6 pb-16 pt-32">
        <div className="max-w-7xl mx-auto w-full">
          <p className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-[0.2em] mb-8">
            Food Waste Prevention
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,7rem)] leading-[0.95] text-[var(--color-text)] max-w-8xl">
            A Seamless Solution
            <br />
            <span className="text-[var(--color-primary)]">for Food Redistribution</span>
          </h1>
          <div className="mt-12 flex items-start gap-16">
            <p className="text-lg text-[var(--color-text-muted)] max-w-md leading-relaxed">
              Smart bins monitor freshness in real-time. When food is ready to donate,
              nearby food banks are notified instantly.
            </p>
            <a
              href="/auth/login"
              className="shrink-0 px-8 py-4 rounded-lg text-base font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Start Free →
            </a>
          </div>
        </div>
      </section>

      {/* IMPACT — Full-bleed sage green band with large stat */}
      <section className="bg-[var(--color-primary)] py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-baseline gap-8">
          <span className="font-[family-name:var(--font-display)] text-[clamp(5rem,12vw,10rem)] leading-none text-white/90">$58B</span>
          <p className="text-white/70 text-xl max-w-sm leading-relaxed">
            of food produced in the Canada is wasted every year.
            Smart Cycle helps grocery stores turn that surplus into meals.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS — Numbered, left-aligned, staggered */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xs mb-20">
            <p className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-[0.2em] mb-3">Process</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
              Bin to food bank in three steps
            </h2>
          </div>

          {/* Staggered steps — not a grid */}
          <div className="space-y-16 max-w-3xl">
            <div className="flex gap-8 items-start">
              <span className="font-[family-name:var(--font-display)] text-6xl text-[var(--color-primary)]/20 leading-none shrink-0">01</span>
              <div>
                <h3 className="font-semibold text-lg text-[var(--color-text)] mb-2">Sensors detect freshness changes</h3>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  IoT bins continuously monitor temperature, gas composition, and weight.
                  When freshness drops below your threshold, the system reacts.
                </p>
              </div>
            </div>
            <div className="flex gap-8 items-start md:ml-24">
              <span className="font-[family-name:var(--font-display)] text-6xl text-[var(--color-accent)]/20 leading-none shrink-0">02</span>
              <div>
                <h3 className="font-semibold text-lg text-[var(--color-text)] mb-2">Store manager reviews & approves</h3>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  An alert appears on your dashboard with weight estimates and bin location.
                  One click to approve the donation.
                </p>
              </div>
            </div>
            <div className="flex gap-8 items-start md:ml-48">
              <span className="font-[family-name:var(--font-display)] text-6xl text-[var(--color-text-light)]/20 leading-none shrink-0">03</span>
              <div>
                <h3 className="font-semibold text-lg text-[var(--color-text)] mb-2">Nearest food bank picks up</h3>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  The system ranks nearby food banks by capacity, distance, and demand —
                  then routes the donation automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES — Asymmetric, not 3 identical cards */}
      <section className="py-28 px-6 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 max-w-lg">
            <p className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-[0.2em] mb-3">Dashboards</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
              Three roles, three workflows
            </h2>
          </div>

          {/* Big-small-small layout, not 3 equal cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Manager — hero card, larger */}
            <div className="bg-[var(--color-primary-light)] rounded-2xl p-10 md:row-span-2">
              <p className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-6">Store Managers</p>
              <h3 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-6">
                Monitor bins,<br />approve donations
              </h3>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed max-w-sm">
                See all your bins at a glance. When an alert fires, review the freshness data
                and approve with one click. Track every donation through pickup.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">Real-time bin status</span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">Alert review</span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">Pickup tracking</span>
              </div>
            </div>

            {/* Food Bank — smaller card */}
            <div className="bg-[var(--color-accent-light)] rounded-2xl p-8">
              <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-4">Food Banks</p>
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-text)] mb-3">
                Accept donations, manage capacity
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Incoming donations appear automatically. Accept or decline based on your current capacity,
                then confirm pickup when collected.
              </p>
            </div>

            {/* Admin — smaller card */}
            <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl p-8">
              <p className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Administrators</p>
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-text)] mb-3">
                Full system oversight
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Register stores and food banks, monitor all bins system-wide,
                and manage the entire donation pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — editorial, not centered box */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-12">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] text-[var(--color-text)] leading-[1.05]">
              Ready to reduce
              <br />
              food waste?
            </h2>
          </div>
          <a
            href="/auth/login"
            className="shrink-0 px-10 py-5 rounded-lg text-lg font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Get Started Free
          </a>
        </div>
      </section>

      {/* Footer — minimal */}
      <footer className="py-6 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[var(--color-text-light)]">
          <span>♻️ Smart Cycle</span>
          <span>B2B Hackathon 2026</span>
        </div>
      </footer>
    </div>
  );
}
