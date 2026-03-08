import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserClaims } from '@/lib/auth';
import AuthButton from '@/components/AuthButton';

/**
 * Admin Dashboard Layout
 *
 * Purple-accented sidebar for admin views.
 * Only accessible to users with 'admin' role.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  if (!claims) {
    redirect('/auth/login');
  }

  if (claims.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col gap-2 shrink-0">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-purple-400">🔒 Admin Dashboard</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">System Administration</p>
        </div>

        <NavLink href="/admin" label="Overview" icon="📊" />
        <NavLink href="/admin/bins" label="All Bins" icon="🗑️" />
        <NavLink href="/admin/alerts" label="All Alerts" icon="🔔" />

        <div className="mt-6 mb-2 px-4 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Register</div>
        <NavLink href="/admin/stores/register" label="Add Store" icon="🏪" />
        <NavLink href="/admin/food-banks/register" label="Add Food Bank" icon="🏦" />

        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)] mb-3 px-4">Admin: {claims.name}</p>
          <AuthButton />
        </div>
      </nav>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-all duration-200"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
