import { getUserClaims } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Food Bank Overview Page
 *
 * Capacity gauge, demand stats, and pending donation count.
 * Uses food_bank_id from Auth0 session claims.
 */

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

export default async function FoodBankOverviewPage(): Promise<React.ReactElement> {
  const claims = await getUserClaims();
  if (!claims?.foodBankId) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Food Bank Overview</h1>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center mt-8">
          <p className="text-4xl mb-4">🏦</p>
          <h2 className="text-lg font-semibold text-amber-400 mb-2">No Food Bank Assigned</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your account does not have a food bank linked yet. Contact your administrator to assign one to your profile.
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
    <div>
      <h1 className="text-2xl font-bold mb-1">Food Bank Overview</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">
        {profile ? profile.name : 'Your food bank at a glance'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Capacity" value={`${inventory}/${capacity} kg`} icon="📦" />
        <StatCard label="Utilization" value={`${utilization}%`} icon="📊" color={utilization > 80 ? 'text-red-400' : 'text-blue-400'} />
        <StatCard label="Pending Donations" value={String(pendingDonations)} icon="⏳" color="text-amber-400" />
        <StatCard label="Accepted" value={String(acceptedDonations)} icon="✅" color="text-emerald-400" />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Storage Capacity</h2>
        <div className="w-full bg-[var(--color-bg)] rounded-full h-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)]">
          <span>{inventory} kg stored</span>
          <span>{Math.max(0, capacity - inventory)} kg available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Weekly Demand</h3>
          <p className="text-2xl font-bold">{profile?.avg_weekly_demand_kg ?? 0} kg</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Pickup Capability</h3>
          <p className="text-2xl font-bold">{profile?.pickup_capability ? '🚚 Yes' : '❌ No'}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-blue-400/30 transition-colors">
      <div className="flex items-center justify-between mb-3"><span className="text-2xl">{icon}</span></div>
      <div className={`text-2xl font-bold mb-1 ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
