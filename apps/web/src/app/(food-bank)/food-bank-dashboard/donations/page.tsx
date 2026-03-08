'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

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
      await fetch(`${API_BASE_URL}/api/v1/demo/respond-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, response, food_bank_id: foodBankId }),
      });
      await fetchDonations();
    } catch { /* empty */ }
    setActing(null);
  };

  const handleConfirmPickup = async (alertId: string): Promise<void> => {
    setActing(alertId);
    try {
      await fetch(`${API_BASE_URL}/api/v1/demo/confirm-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, food_bank_id: foodBankId }),
      });
      await fetchDonations();
    } catch { /* empty */ }
    setActing(null);
  };

  const statusBorder: Record<string, string> = {
    pending: 'border-[var(--color-warning)]/30',
    accepted: 'border-[var(--color-success)]/30',
    declined: 'border-[var(--color-danger)]/30',
    no_response: 'border-[var(--color-border)]',
  };

  const priorityStyles: Record<string, string> = {
    critical: 'bg-[var(--color-critical)]/10 text-[var(--color-critical)]',
    high: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    medium: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    low: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  };

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl mb-1 text-[var(--color-text)]">Incoming Donations</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Review, accept, or decline donation alerts</p>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Loading donations...</p>
      ) : !foodBankId ? (
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-12 text-center">
          <p className="text-[var(--color-text-muted)]">No food bank linked to your account yet</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
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
              <div key={donation.id} className={`rounded-xl border bg-[var(--color-surface)] p-5 transition-colors ${statusBorder[donation.response] ?? 'border-[var(--color-border)]'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityStyles[alert.priority] ?? ''}`}>{alert.priority}</span>
                    <span className="font-medium text-[var(--color-text)]">
                      {store ? `${store.name} — ${store.city}, ${store.state}` : alert.bins?.label ?? 'Unknown'}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    donation.response === 'pending' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
                    donation.response === 'accepted' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' :
                    'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                  }`}>
                    {donation.response}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)] mb-4">
                  <span>{alert.estimated_weight_kg} kg</span>
                  <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                  <span>Expires: {new Date(alert.expires_at).toLocaleString()}</span>
                  {alert.bins?.store_address && <span>{alert.bins.store_address}</span>}
                </div>

                {donation.response === 'pending' && (
                  <div className="flex gap-3 pt-3 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => handleRespond(alertId, 'accepted')}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isActing ? '...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRespond(alertId, 'declined')}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isActing ? '...' : 'Decline'}
                    </button>
                  </div>
                )}

                {donation.response === 'accepted' && alert.status === 'accepted' && (
                  <div className="flex gap-3 pt-3 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => handleConfirmPickup(alertId)}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isActing ? 'Confirming...' : 'Confirm Pickup'}
                    </button>
                  </div>
                )}

                {alert.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-success)] font-medium">Pickup confirmed — {alert.estimated_weight_kg} kg added to inventory</p>
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
