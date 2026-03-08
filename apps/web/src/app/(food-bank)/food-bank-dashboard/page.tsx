import { getUserClaims } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FoodBankProfile {
  id: string; name: string; capacity_kg: number | null;
  current_inventory_kg: number | null; avg_weekly_demand_kg: number | null;
  priority_score: number | null; pickup_capability: boolean;
}

interface DonationRecipient {
  id: string; response: string;
  donation_alerts: { id: string; status: string; estimated_weight_kg: number } | null;
}

async function fetchProfile(foodBankId: string): Promise<FoodBankProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/food-banks/${foodBankId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json() as { data: FoodBankProfile };
    return json.data;
  } catch { return null; }
}

async function fetchDonations(foodBankId: string): Promise<DonationRecipient[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/food-banks/${foodBankId}/donations`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: DonationRecipient[] };
    return json.data;
  } catch { return []; }
}

/**
 * Food Bank Overview — Capacity-first layout
 *
 * Instead of 4 equal stat cards, the page leads with a large capacity gauge
 * (the thing food bank coordinators care about most), then shows pending
 * donations as actionable items, and ops details as secondary info.
 */
export default async function FoodBankOverviewPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();
  if (!claims?.foodBankId) {
    return (
      <div className="fade-in max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-3">Food Bank Overview</h1>
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-8 mt-4">
          <h2 className="font-semibold text-[var(--color-warning)] mb-2">No Food Bank Assigned</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Contact your administrator to assign a food bank to your profile.
          </p>
        </div>
      </div>
    );
  }

  const [profile, donations] = await Promise.all([
    fetchProfile(claims.foodBankId),
    fetchDonations(claims.foodBankId),
  ]);

  const capacity = profile?.capacity_kg ?? 0;
  const inventory = profile?.current_inventory_kg ?? 0;
  const utilization = capacity > 0 ? Math.round((inventory / capacity) * 100) : 0;
  const pendingDonations = donations.filter(d => d.response === 'pending').length;
  const acceptedDonations = donations.filter(d => d.response === 'accepted').length;

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)] mb-1">
        {profile ? profile.name : 'Food Bank Overview'}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-10">Capacity and incoming donations</p>

      {/* Hero: Capacity gauge — the single most important number */}
      <div className="flex items-end gap-6 mb-12">
        <div>
          <span className="font-[family-name:var(--font-display)] text-[clamp(4rem,8vw,6rem)] leading-none" style={{
            color: utilization > 80 ? 'var(--color-danger)' : utilization > 50 ? 'var(--color-warning)' : 'var(--color-primary)',
          }}>
            {utilization}%
          </span>
        </div>
        <div className="pb-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            {inventory} of {capacity} kg filled
          </p>
          <div className="w-48 bg-[var(--color-surface-elevated)] rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(utilization, 100)}%`,
                backgroundColor: utilization > 80 ? 'var(--color-danger)' : utilization > 50 ? 'var(--color-warning)' : 'var(--color-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Pending donations — actionable items */}
      {pendingDonations > 0 && (
        <div className="mb-10 p-5 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[var(--color-accent)]">
              {pendingDonations} incoming donation{pendingDonations > 1 ? 's' : ''} waiting
            </h2>
            <a href="/food-bank-dashboard/donations" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
              Review all →
            </a>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Accept or decline donations from the donations page.
          </p>
        </div>
      )}

      {/* Status summary — inline, not cards */}
      <div className="flex items-center gap-10 py-6 border-y border-[var(--color-border)] mb-10">
        <div>
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">{donations.length}</span>
          <span className="text-sm text-[var(--color-text-muted)] ml-2">total donations</span>
        </div>
        <div>
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-success)]">{acceptedDonations}</span>
          <span className="text-sm text-[var(--color-text-muted)] ml-2">accepted</span>
        </div>
        <div>
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-warning)]">{pendingDonations}</span>
          <span className="text-sm text-[var(--color-text-muted)] ml-2">pending</span>
        </div>
      </div>

      {/* Operations — secondary details, compact */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Operations</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm max-w-md">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Weekly demand</span>
            <span className="font-medium text-[var(--color-text)]">{profile?.avg_weekly_demand_kg ?? 0} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Available space</span>
            <span className="font-medium text-[var(--color-text)]">{Math.max(0, capacity - inventory)} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Pickup capability</span>
            <span className="font-medium text-[var(--color-text)]">{profile?.pickup_capability ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Priority score</span>
            <span className="font-medium text-[var(--color-text)]">{profile?.priority_score ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
