import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserClaims } from '@/lib/auth';
import AuthButton from '@/components/AuthButton';

/**
 * Food Bank Coordinator Dashboard Layout
 *
 * Warm sidebar with terracotta accent.
 * Redirects to /auth/login if not authenticated, or / if wrong role.
 */
export default async function FoodBankLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  if (!claims) {
    redirect('/auth/login');
  }

  if (claims.role !== 'food_bank_coordinator' && claims.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] p-6 flex flex-col gap-1 shrink-0" aria-label="Food bank navigation">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-[var(--color-accent)]">Food Bank Dashboard</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage incoming donations</p>
        </div>

        <NavLink href="/food-bank-dashboard" label="Overview" />
        <NavLink href="/food-bank-dashboard/donations" label="Incoming Donations" />
        <NavLink href="/food-bank-dashboard/inventory" label="Inventory" />
        <NavLink href="/food-bank-dashboard/settings" label="Settings" />

        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)] mb-3 px-3">Signed in as {claims.name}</p>
          <AuthButton />
        </div>
      </nav>

      <main className="flex-1 p-8 overflow-auto bg-[var(--color-bg)]">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
    >
      {label}
    </Link>
  );
}
