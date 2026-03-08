import { getUserClaims } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface BinSummary { id: string; label: string; status: string; last_seen_at: string | null; }
interface AlertSummary {
  id: string; priority: string; status: string; estimated_weight_kg: number;
  created_at: string; bins: { label: string } | null;
}

async function fetchStoreBins(storeId: string): Promise<BinSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/bins`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: BinSummary[] };
    return json.data;
  } catch { return []; }
}

async function fetchStoreAlerts(storeId: string): Promise<AlertSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/alerts`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: AlertSummary[] };
    return json.data;
  } catch { return []; }
}

/**
 * Store Overview — Bin-first layout
 *
 * Instead of 4 stat cards, the page shows bins as the primary element
 * (since that's what store managers care about), with an action strip
 * for pending alerts.
 */
export default async function StoreOverviewPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();

  if (!claims?.storeId) {
    return (
      <div className="fade-in max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-3">Store Overview</h1>
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-8 mt-4">
          <h2 className="font-semibold text-[var(--color-warning)] mb-2">No Store Assigned</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Contact your administrator to assign a store to your profile.
          </p>
        </div>
      </div>
    );
  }

  const [bins, alerts] = await Promise.all([
    fetchStoreBins(claims.storeId),
    fetchStoreAlerts(claims.storeId),
  ]);

  const onlineBins = bins.filter(b => b.status === 'online');
  const offlineBins = bins.filter(b => b.status === 'offline');
  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-1">Store Overview</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">Your bins and donations at a glance</p>

      {/* Action strip — pending alerts are the call-to-action */}
      {pendingAlerts.length > 0 && (
        <div className="mb-10 p-5 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--color-accent)]">
              {pendingAlerts.length} alert{pendingAlerts.length > 1 ? 's' : ''} need your approval
            </h2>
            <a href="/store-dashboard/alerts" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
              Review all →
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            {pendingAlerts.map(alert => (
              <div key={alert.id} className="text-xs bg-white/80 rounded-lg px-3 py-2 text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text)]">{alert.bins?.label ?? 'Bin'}</span>
                {' · '}{alert.estimated_weight_kg} kg
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bins — the primary content, shown as a live status board */}
      <div className="mb-10">
        <div className="flex items-baseline gap-4 mb-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Your Bins</h2>
          <span className="text-xs text-[var(--color-text-light)]">
            {onlineBins.length} online · {offlineBins.length} offline
          </span>
        </div>

        {bins.length === 0 ? (
          <p className="text-sm text-[var(--color-text-light)] py-6">
            No bins assigned yet. Ask an admin to register bins for your store.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {bins.map(bin => (
              <div
                key={bin.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors ${
                  bin.status === 'online'
                    ? 'border-[var(--color-success)]/20 bg-[var(--color-success)]/5'
                    : 'border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  bin.status === 'online' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'
                }`} />
                <span className="font-medium text-[var(--color-text)]">{bin.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity — timeline, not table */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-5">Recent Activity</h2>
        {recentAlerts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-light)]">No alerts yet — bins are reporting normally.</p>
        ) : (
          <div className="border-l-2 border-[var(--color-border)] pl-6 space-y-6 ml-2">
            {recentAlerts.map(alert => (
              <div key={alert.id} className="relative">
                <span className={`absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full border-2 border-[var(--color-bg)] ${
                  alert.status === 'pending' ? 'bg-[var(--color-warning)]' :
                  alert.status === 'approved_by_store' || alert.status === 'routed' ? 'bg-[var(--color-primary)]' :
                  'bg-[var(--color-success)]'
                }`} />
                <p className="text-sm text-[var(--color-text)]">
                  <span className="font-medium">{alert.bins?.label ?? 'Bin'}</span>
                  {' — '}
                  <span className={`font-medium ${
                    alert.priority === 'critical' ? 'text-[var(--color-critical)]' :
                    alert.priority === 'high' ? 'text-[var(--color-danger)]' :
                    'text-[var(--color-text)]'
                  }`}>{alert.priority}</span>
                  {' · '}{alert.estimated_weight_kg} kg
                </p>
                <p className="text-xs text-[var(--color-text-light)] mt-0.5">
                  {new Date(alert.created_at).toLocaleDateString()} · {alert.status.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
