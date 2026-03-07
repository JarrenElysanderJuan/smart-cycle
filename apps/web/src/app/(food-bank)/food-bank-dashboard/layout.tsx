import Link from 'next/link';

/**
 * Food Bank Coordinator Dashboard Layout
 *
 * Blue-accented sidebar for food bank coordinator views.
 * TODO: [AUTH0] Gate this layout — redirect to /login if user role !== 'food_bank_coordinator'
 */
export default function FoodBankLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex min-h-screen">
      <nav className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col gap-2 shrink-0">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-blue-400">🏦 Food Bank Dashboard</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage incoming donations</p>
        </div>

        <NavLink href="/food-bank-dashboard" label="Overview" icon="📊" />
        <NavLink href="/food-bank-dashboard/donations" label="Incoming Donations" icon="📦" />
        <NavLink href="/food-bank-dashboard/inventory" label="Inventory" icon="📋" />
        <NavLink href="/food-bank-dashboard/settings" label="Settings" icon="⚙️" />

        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <NavLink href="/" label="Admin Dashboard" icon="🔒" />
          <NavLink href="/store-dashboard" label="Store View" icon="🏪" />
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
