import { API_BASE_URL } from '@/lib/supabase';

interface BinSummary {
  id: string;
  label: string;
  status: string;
  last_seen_at: string | null;
  store_address: string | null;
  organization_id: string;
}

interface AlertSummary {
  id: string;
  priority: string;
  status: string;
  estimated_weight_kg: number;
  created_at: string;
  bins: { label: string; store_address: string | null } | null;
}

async function fetchBins(): Promise<BinSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/bins?limit=100`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json() as { data: BinSummary[] };
    return json.data;
  } catch {
    return [];
  }
}

async function fetchAlerts(): Promise<AlertSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/alerts?limit=10&status=pending`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json() as { data: AlertSummary[] };
    return json.data;
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function OverviewPage(): Promise<React.ReactElement> {
  const [bins, alerts] = await Promise.all([fetchBins(), fetchAlerts()]);

  const onlineBins = bins.filter((b) => b.status === 'online').length;
  const offlineBins = bins.filter((b) => b.status === 'offline').length;
  const maintenanceBins = bins.filter((b) => b.status === 'maintenance').length;
  const pendingAlerts = alerts.length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard Overview</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Organization-wide bin health and alert summary</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Bins" value={bins.length} icon="🗑️" />
        <StatCard label="Online" value={onlineBins} icon="🟢" color="text-[var(--color-success)]" />
        <StatCard label="Offline" value={offlineBins} icon="🔴" color="text-[var(--color-danger)]" />
        <StatCard label="Pending Alerts" value={pendingAlerts} icon="🔔" color="text-[var(--color-warning)]" />
      </div>

      {/* Offline Bins Warning */}
      {offlineBins > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5">
          <h3 className="text-sm font-semibold text-[var(--color-danger)] mb-2">
            ⚠️ {offlineBins} bin{offlineBins > 1 ? 's' : ''} offline
          </h3>
          <div className="space-y-2">
            {bins
              .filter((b) => b.status === 'offline')
              .map((bin) => (
                <div key={bin.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">{bin.label}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Last seen: {bin.last_seen_at ? new Date(bin.last_seen_at).toLocaleString() : 'Never'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bins Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">All Bins</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left px-6 py-3 font-medium">Label</th>
                <th className="text-left px-6 py-3 font-medium">Location</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {bins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                    No bins registered yet. Use the API to register bins.
                  </td>
                </tr>
              ) : (
                bins.map((bin) => (
                  <tr key={bin.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] transition-colors">
                    <td className="px-6 py-3 font-medium">{bin.label}</td>
                    <td className="px-6 py-3 text-[var(--color-text-muted)]">{bin.store_address ?? '—'}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={bin.status} />
                    </td>
                    <td className="px-6 py-3 text-[var(--color-text-muted)]">
                      {bin.last_seen_at ? new Date(bin.last_seen_at).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Pending Alerts</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="px-6 py-8 text-center text-[var(--color-text-muted)]">No pending alerts</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--color-surface-elevated)] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={alert.priority} />
                    <span className="font-medium">{alert.bins?.label ?? 'Unknown bin'}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {alert.estimated_weight_kg} kg available • {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={alert.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold mb-1 ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const styles: Record<string, string> = {
    online: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    offline: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    maintenance: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    pending: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    accepted: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    expired: 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]',
    cancelled: 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? ''}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }): React.ReactElement {
  const styles: Record<string, string> = {
    critical: 'bg-[var(--color-critical)]/10 text-[var(--color-critical)]',
    high: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    medium: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    low: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${styles[priority] ?? ''}`}>
      {priority}
    </span>
  );
}
