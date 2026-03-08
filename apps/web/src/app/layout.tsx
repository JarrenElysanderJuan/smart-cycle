import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Cycle — Food Waste Prevention Dashboard',
  description: 'Monitor smart bins, track freshness, and route donations to local food banks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <nav className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col gap-2 shrink-0">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-[var(--color-primary)]">♻️ Smart Cycle</h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Food Waste Prevention</p>
            </div>

            <NavLink href="/" label="Overview" icon="📊" />
            <NavLink href="/bins" label="Bins" icon="🗑️" />
            <NavLink href="/alerts" label="Alerts" icon="🔔" />

            <div className="mt-6 mb-2 px-4 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Register</div>
            <NavLink href="/stores/register" label="Add Store" icon="🏪" />
            <NavLink href="/food-banks/register" label="Add Food Bank" icon="🏦" />
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
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
