import { API_BASE_URL } from '@/lib/supabase';

interface Alert {
  id: string;
  bin_id: string;
  priority: string;
  estimated_weight_kg: number;
  status: string;
  expires_at: string;
  created_at: string;
  resolved_at: string | null;
  bins: { id: string; label: string; store_address: string | null; organization_id: string } | null;
}

async function fetchAlerts(status?: string): Promise<Alert[]> {
  try {
    const url = status
      ? `${API_BASE_URL}/api/v1/alerts?limit=50&status=${status}`
      : `${API_BASE_URL}/api/v1/alerts?limit=50`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: Alert[] };
    return json.data;
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<React.ReactElement> {
  const resolvedParams = await searchParams;
  const filterStatus = resolvedParams.status;
  const alerts = await fetchAlerts(filterStatus);

  const statusFilters = ['all', 'pending', 'accepted', 'expired', 'cancelled'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Donation Alerts</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">
        Track active and past donation alerts
      </p>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6">
        {statusFilters.map((s) => (
          <a
            key={s}
            href={s === 'all' ? '/admin/alerts' : `/admin/alerts?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (s === 'all' && !filterStatus) || filterStatus === s
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      {/* Alerts List */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-lg font-medium">No alerts found</p>
            <p className="text-sm mt-1">
              {filterStatus ? `No ${filterStatus} alerts` : 'Alerts will appear when bin freshness drops below thresholds'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="px-6 py-5 hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={alert.priority} />
                    <span className="font-semibold">{alert.bins?.label ?? 'Unknown bin'}</span>
                  </div>
                  <StatusBadge status={alert.status} />
                </div>
                <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
                  <span>📦 {alert.estimated_weight_kg.toFixed(1)} kg</span>
                  <span>📍 {alert.bins?.store_address ?? '—'}</span>
                  <span>🕐 Created: {new Date(alert.created_at).toLocaleString()}</span>
                  <span>⏰ Expires: {new Date(alert.expires_at).toLocaleString()}</span>
                </div>
                {alert.resolved_at && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Resolved: {new Date(alert.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const styles: Record<string, string> = {
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
