'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

/**
 * Incoming Donations Page — client component.
 *
 * Fetches food_bank_id from the user_profiles API (fallback from JWT claims).
 */

interface Donation {
  id: string;
  response: string;
  notified_at: string;
  responded_at: string | null;
  donation_alerts: {
    id: string; status: string; priority: string;
    estimated_weight_kg: number; created_at: string;
    expires_at: string; approved_at: string | null; picked_up_at: string | null;
    bins: {
      id: string; label: string; store_address: string | null;
      latitude: number | null; longitude: number | null;
      stores: { id: string; name: string; city: string; state: string } | null;
    } | null;
  } | null;
}

export default function DonationsPage(): React.ReactElement {
  const { user } = useUser();
  const [foodBankId, setFoodBankId] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // Fetch food_bank_id from user_profiles API
  useEffect(() => {
    if (!user?.sub) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/users/profile/${encodeURIComponent(user.sub)}`);
        if (res.ok) {
          const json = await res.json() as { data: { food_bank_id?: string } };
          setFoodBankId(json.data?.food_bank_id ?? null);
        }
      } catch { /* empty */ }
    })();
  }, [user?.sub]);

  const fetchDonations = async (): Promise<void> => {
    if (!foodBankId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/food-banks/${foodBankId}/donations`);
      if (res.ok) {
        const json = await res.json() as { data: Donation[] };
        setDonations(json.data);
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchDonations(); }, [foodBankId]);

  const handleRespond = async (alertId: string, response: 'accepted' | 'declined'): Promise<void> => {
    setActing(alertId);
    try {
      await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, food_bank_id: foodBankId }),
      });
      await fetchDonations();
    } catch { /* empty */ }
    setActing(null);
  };

  const handleConfirmPickup = async (alertId: string): Promise<void> => {
    setActing(alertId);
    try {
      await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/confirm-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_bank_id: foodBankId }),
      });
      await fetchDonations();
    } catch { /* empty */ }
    setActing(null);
  };

  const statusColor: Record<string, string> = {
    pending: 'border-amber-500/30 bg-amber-500/5',
    accepted: 'border-emerald-500/30 bg-emerald-500/5',
    declined: 'border-red-500/30 bg-red-500/5',
    no_response: 'border-gray-500/30 bg-gray-500/5',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Incoming Donations</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Review, accept, or decline donation alerts</p>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Loading donations...</p>
      ) : !foodBankId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-12 text-center">
          <p className="text-4xl mb-4">⚙️</p>
          <p className="text-[var(--color-text-muted)]">No food bank linked to your account yet</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-[var(--color-text-muted)]">No incoming donations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map(donation => {
            const alert = donation.donation_alerts;
            if (!alert) return null;
            const store = alert.bins?.stores;
            const alertId = alert.id;
            const isActing = acting === alertId;

            return (
              <div key={donation.id} className={`rounded-xl border p-5 transition-colors ${statusColor[donation.response] ?? 'border-[var(--color-border)]'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      alert.priority === 'critical' ? 'bg-red-500/10 text-red-400' :
                      alert.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                      alert.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>{alert.priority}</span>
                    <span className="font-medium">
                      {store ? `${store.name} — ${store.city}, ${store.state}` : alert.bins?.label ?? 'Unknown'}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    donation.response === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                    donation.response === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {donation.response}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)] mb-4">
                  <span>📦 {alert.estimated_weight_kg} kg</span>
                  <span>📅 {new Date(alert.created_at).toLocaleDateString()}</span>
                  <span>⏰ Expires: {new Date(alert.expires_at).toLocaleString()}</span>
                  {alert.bins?.store_address && <span>📍 {alert.bins.store_address}</span>}
                </div>

                {donation.response === 'pending' && (
                  <div className="flex gap-3 pt-3 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => handleRespond(alertId, 'accepted')}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {isActing ? '...' : '✅ Accept'}
                    </button>
                    <button
                      onClick={() => handleRespond(alertId, 'declined')}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {isActing ? '...' : '❌ Decline'}
                    </button>
                  </div>
                )}

                {donation.response === 'accepted' && alert.status === 'accepted' && (
                  <div className="flex gap-3 pt-3 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => handleConfirmPickup(alertId)}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isActing ? 'Confirming...' : '🚚 Confirm Pickup'}
                    </button>
                  </div>
                )}

                {alert.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <p className="text-sm text-emerald-400">✅ Pickup confirmed — {alert.estimated_weight_kg} kg added to inventory</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
