import { getUserClaims } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Store Bins Page — shows bins belonging to this store.
 * Uses store_id from Auth0 session claims.
 */

interface BinSummary {
  id: string; label: string; status: string; last_seen_at: string | null;
  store_address: string | null; location_description: string | null;
}

async function fetchBins(storeId: string): Promise<BinSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/bins`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: BinSummary[] };
    return json.data;
  } catch { return []; }
}

export default async function StoreBinsPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();
  if (!claims?.storeId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center mt-8">
        <p className="text-4xl mb-4">🏪</p>
        <h2 className="text-lg font-semibold text-amber-400 mb-2">No Store Assigned</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Contact your administrator to assign a store to your profile.</p>
      </div>
    );
  }

  const bins = await fetchBins(claims.storeId);

  const statusDot: Record<string, string> = {
    online: 'bg-emerald-400', offline: 'bg-red-400', maintenance: 'bg-amber-400',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Bins</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">{bins.length} bins registered</p>

      {bins.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-4xl mb-4">🗑️</p>
          <p className="text-[var(--color-text-muted)]">No bins assigned to this store yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bins.map(bin => (
            <div key={bin.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-emerald-400/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">{bin.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusDot[bin.status] ?? 'bg-gray-400'}`} />
                  <span className="text-xs text-[var(--color-text-muted)]">{bin.status}</span>
                </div>
              </div>
              {bin.location_description && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2">📍 {bin.location_description}</p>
              )}
              <p className="text-xs text-[var(--color-text-muted)]">
                Last seen: {bin.last_seen_at ? new Date(bin.last_seen_at).toLocaleString() : 'Never'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
