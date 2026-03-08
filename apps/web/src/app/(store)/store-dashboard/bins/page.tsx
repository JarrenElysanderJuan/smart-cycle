import { getUserClaims } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
      <div className="rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-warning)] mb-2">No Store Assigned</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Contact your administrator to assign a store to your profile.</p>
      </div>
    );
  }

  const bins = await fetchBins(claims.storeId);

  const statusDot: Record<string, string> = {
    online: 'bg-[var(--color-success)]', offline: 'bg-[var(--color-danger)]', maintenance: 'bg-[var(--color-warning)]',
  };

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl mb-1 text-[var(--color-text)]">My Bins</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">{bins.length} bins registered</p>

      {bins.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)]">No bins assigned to this store yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bins.map(bin => (
            <div key={bin.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[var(--color-text)]">{bin.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusDot[bin.status] ?? 'bg-gray-400'}`} />
                  <span className="text-xs text-[var(--color-text-muted)]">{bin.status}</span>
                </div>
              </div>
              {bin.location_description && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2">{bin.location_description}</p>
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
