import Link from 'next/link';
import { API_BASE_URL } from '@/lib/supabase';

interface Bin {
  id: string;
  label: string;
  status: string;
  last_seen_at: string | null;
  store_address: string | null;
  organization_id: string;
  created_at: string;
}

async function fetchBins(): Promise<Bin[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/bins?limit=100`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json() as { data: Bin[] };
    return json.data;
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function BinsPage(): Promise<React.ReactElement> {
  const bins = await fetchBins();

  const onlineCount = bins.filter((b) => b.status === 'online').length;
  const offlineCount = bins.filter((b) => b.status === 'offline').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bins</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {bins.length} bins registered • {onlineCount} online • {offlineCount} offline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bins.length === 0 ? (
          <div className="col-span-full text-center py-16 text-[var(--color-text-muted)]">
            <p className="text-4xl mb-4">🗑️</p>
            <p className="text-lg font-medium">No bins registered yet</p>
            <p className="text-sm mt-1">Use the API to register your first bin</p>
          </div>
        ) : (
          bins.map((bin) => (
            <Link
              key={bin.id}
              href={`/admin/bins/${bin.id}`}
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-[var(--color-primary-glow)] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{bin.label}</span>
                <StatusDot status={bin.status} />
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                {bin.store_address ?? 'No address set'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Last seen: {bin.last_seen_at ? new Date(bin.last_seen_at).toLocaleString() : 'Never'}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }): React.ReactElement {
  const colors: Record<string, string> = {
    online: 'bg-[var(--color-success)]',
    offline: 'bg-[var(--color-danger)]',
    maintenance: 'bg-[var(--color-warning)]',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status] ?? 'bg-gray-400'} ${status === 'online' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-[var(--color-text-muted)] capitalize">{status}</span>
    </div>
  );
}
