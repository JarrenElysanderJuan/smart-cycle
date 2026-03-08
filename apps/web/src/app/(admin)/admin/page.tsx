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
    const res = await fetch(`${API_BASE_URL}/api/v1/bins?limit=100`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: BinSummary[] };
    return json.data;
  } catch { return []; }
}

async function fetchAlerts(): Promise<AlertSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/alerts?limit=10&status=pending`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: AlertSummary[] };
    return json.data;
  } catch { return []; }
}

export const dynamic = 'force-dynamic';

/**
 * Admin Overview — system-wide dashboard with all bins and alerts.
 * Accessible only to admin role (gated by layout).
 */
export default async function AdminOverviewPage(): Promise<React.ReactElement> {
  const [bins, alerts] = await Promise.all([fetchBins(), fetchAlerts()]);

  const onlineBins = bins.filter((b) => b.status === 'online').length;
  const offlineBins = bins.filter((b) => b.status === 'offline').length;
  const pendingAlerts = alerts.length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Overview</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">System-wide bin health and alert summary</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Bins" value={bins.length} icon="🗑️" />
        <StatCard label="Online" value={onlineBins} icon="🟢" color="text-emerald-400" />
        <StatCard label="Offline" value={offlineBins} icon="🔴" color="text-red-400" />
        <StatCard label="Pending Alerts" value={pendingAlerts} icon="🔔" color="text-amber-400" />
      </div>

      {offlineBins > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <h3 className="text-sm font-semibold text-red-400 mb-2">⚠️ {offlineBins} bin{offlineBins > 1 ? 's' : ''} offline</h3>
          <div className="space-y-2">
            {bins.filter((b) => b.status === 'offline').map((bin) => (
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

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Pending Alerts</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="px-6 py-8 text-center text-[var(--color-text-muted)]">No pending alerts 🎉</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--color-surface-elevated)] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      alert.priority === 'critical' ? 'bg-red-500/10 text-red-400' :
                      alert.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                      alert.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>{alert.priority}</span>
                    <span className="font-medium">{alert.bins?.label ?? 'Unknown bin'}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {alert.estimated_weight_kg} kg • {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-medium">
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color?: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-purple-400/30 transition-colors">
      <div className="flex items-center justify-between mb-3"><span className="text-2xl">{icon}</span></div>
      <div className={`text-3xl font-bold mb-1 ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
