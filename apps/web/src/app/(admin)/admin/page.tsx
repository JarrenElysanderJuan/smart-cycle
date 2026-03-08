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
 * Admin Overview — Anomaly-first layout
 *
 * Instead of 4 equal stat cards, the page leads with a status sentence,
 * then shows problems (offline bins, pending alerts) prominently,
 * and pushes "everything OK" stats to the side.
 */
export default async function AdminOverviewPage(): Promise<React.ReactElement> {
  const [bins, alerts] = await Promise.all([fetchBins(), fetchAlerts()]);

  const onlineBins = bins.filter((b) => b.status === 'online').length;
  const offlineBins = bins.filter((b) => b.status === 'offline').length;
  const pendingAlerts = alerts.length;
  const hasProblems = offlineBins > 0 || pendingAlerts > 0;

  return (
    <div className="fade-in max-w-4xl">
      {/* Status sentence instead of hero metrics */}
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-3">System Status</h1>
      <p className="text-lg text-[var(--color-text-muted)] mb-10 leading-relaxed">
        {bins.length === 0 ? (
          'No bins registered yet. Register stores and add bins to get started.'
        ) : hasProblems ? (
          <>
            <span className="text-[var(--color-text)] font-medium">{onlineBins} of {bins.length}</span> bins online.
            {offlineBins > 0 && <> <span className="text-[var(--color-danger)] font-medium">{offlineBins} offline.</span></>}
            {pendingAlerts > 0 && <> <span className="text-[var(--color-warning)] font-medium">{pendingAlerts} alerts</span> need attention.</>}
          </>
        ) : (
          <>All <span className="text-[var(--color-success)] font-medium">{bins.length} bins online</span>. No pending alerts.</>
        )}
      </p>

      {/* Problems first — not equal weight to healthy stats */}
      {offlineBins > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-danger)] uppercase tracking-wider mb-4">Offline Bins</h2>
          <div className="space-y-2">
            {bins.filter((b) => b.status === 'offline').map((bin) => (
              <div key={bin.id} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
                  <span className="font-medium text-[var(--color-text)]">{bin.label}</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Last seen: {bin.last_seen_at ? new Date(bin.last_seen_at).toLocaleString() : 'Never'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending alerts — table, not cards */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Pending Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-light)] py-4">No pending alerts — all clear.</p>
        ) : (
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Bin</th>
                  <th className="text-left px-5 py-3 font-medium">Priority</th>
                  <th className="text-right px-5 py-3 font-medium">Weight</th>
                  <th className="text-right px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--color-text)]">{alert.bins?.label ?? 'Unknown'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold uppercase ${
                        alert.priority === 'critical' ? 'text-[var(--color-critical)]' :
                        alert.priority === 'high' ? 'text-[var(--color-danger)]' :
                        alert.priority === 'medium' ? 'text-[var(--color-warning)]' :
                        'text-[var(--color-success)]'
                      }`}>{alert.priority}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">{alert.estimated_weight_kg} kg</td>
                    <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">{new Date(alert.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick counts — secondary, bottom of page, inline */}
      <div className="flex items-center gap-10 pt-6 border-t border-[var(--color-border)] text-sm">
        <div>
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">{bins.length}</span>
          <span className="text-[var(--color-text-muted)] ml-2">total bins</span>
        </div>
        <div>
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-success)]">{onlineBins}</span>
          <span className="text-[var(--color-text-muted)] ml-2">online</span>
        </div>
        <div>
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-danger)]">{offlineBins}</span>
          <span className="text-[var(--color-text-muted)] ml-2">offline</span>
        </div>
      </div>
    </div>
  );
}
