import { API_BASE_URL } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Store Manager Overview Page
 *
 * Shows summary stats and pending alerts that need approval.
 * TODO: [AUTH0] Scope by authenticated user's store_id from JWT claims.
 */

// TODO: [AUTH0] Replace hardcoded storeId with value from user session
const DEMO_STORE_ID = 'c0000000-0000-0000-0000-000000000001';

interface BinSummary { id: string; label: string; status: string; last_seen_at: string | null; }
interface AlertSummary {
  id: string; priority: string; status: string; estimated_weight_kg: number;
  created_at: string; bins: { label: string } | null;
}

async function fetchStoreBins(): Promise<BinSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${DEMO_STORE_ID}/bins`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: BinSummary[] };
    return json.data;
  } catch { return []; }
}

async function fetchStoreAlerts(): Promise<AlertSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${DEMO_STORE_ID}/alerts`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: AlertSummary[] };
    return json.data;
  } catch { return []; }
}

export default async function StoreOverviewPage(): Promise<React.ReactElement> {
  const [bins, alerts] = await Promise.all([fetchStoreBins(), fetchStoreAlerts()]);

  const onlineBins = bins.filter(b => b.status === 'online').length;
  const offlineBins = bins.filter(b => b.status === 'offline').length;
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
  const approvedAlerts = alerts.filter(a => a.status === 'approved_by_store' || a.status === 'routed').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Store Overview</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Your bins and donation alerts</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Bins" value={bins.length} icon="🗑️" />
        <StatCard label="Online" value={onlineBins} icon="🟢" color="text-emerald-400" />
        <StatCard label="Offline" value={offlineBins} icon="🔴" color="text-red-400" />
        <StatCard label="Needs Approval" value={pendingAlerts} icon="⏳" color="text-amber-400" />
      </div>

      {/* Pending alerts that need store manager approval */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">Alerts Needing Approval</h2>
          <span className="text-xs text-[var(--color-text-muted)]">{pendingAlerts} pending</span>
        </div>
        {alerts.filter(a => a.status === 'pending').length === 0 ? (
          <p className="px-6 py-8 text-center text-[var(--color-text-muted)]">No alerts need approval right now 🎉</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {alerts.filter(a => a.status === 'pending').map(alert => (
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
                  Pending Approval
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently approved / routed */}
      {approvedAlerts > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm text-emerald-400">✅ {approvedAlerts} alert{approvedAlerts > 1 ? 's' : ''} approved and routed to food banks</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color?: string }): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-emerald-400/30 transition-colors">
      <div className="flex items-center justify-between mb-3"><span className="text-2xl">{icon}</span></div>
      <div className={`text-3xl font-bold mb-1 ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
