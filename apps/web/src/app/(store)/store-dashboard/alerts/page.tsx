'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

/**
 * Store Alerts Page — client component.
 *
 * The store_id comes from the user's Auth0 claims (injected by the
 * Post-Login Action). We read it from the client-side user object.
 */
const CLAIMS_NAMESPACE = 'https://smart-cycle.com';

interface Alert {
  id: string;
  priority: string;
  status: string;
  estimated_weight_kg: number;
  created_at: string;
  expires_at: string;
  bins: { id: string; label: string; store_address: string | null } | null;
  donation_alert_recipients: Array<{
    id: string; food_bank_id: string; response: string;
    food_banks: { id: string; name: string } | null;
  }>;
}

export default function StoreAlertsPage(): React.ReactElement {
  const { user } = useUser();
  const storeId = user?.[`${CLAIMS_NAMESPACE}/store_id`] as string | undefined;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchAlerts = async (): Promise<void> => {
    if (!storeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/alerts`);
      if (res.ok) {
        const json = await res.json() as { data: Alert[] };
        setAlerts(json.data);
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, [storeId]);

  const handleApprove = async (alertId: string): Promise<void> => {
    setApproving(alertId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch { /* empty */ }
    setApproving(null);
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400',
    approved_by_store: 'bg-blue-500/10 text-blue-400',
    routed: 'bg-purple-500/10 text-purple-400',
    accepted: 'bg-emerald-500/10 text-emerald-400',
    picked_up: 'bg-teal-500/10 text-teal-400',
    completed: 'bg-green-500/10 text-green-400',
    expired: 'bg-gray-500/10 text-gray-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Store Alerts</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Review and approve donations from your bins</p>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)]">No alerts from your store yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-emerald-400/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    alert.priority === 'critical' ? 'bg-red-500/10 text-red-400' :
                    alert.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                    alert.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>{alert.priority}</span>
                  <span className="font-medium">{alert.bins?.label ?? 'Unknown bin'}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[alert.status] ?? ''}`}>
                  {alert.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)] mb-3">
                <span>📦 {alert.estimated_weight_kg} kg</span>
                <span>📅 {new Date(alert.created_at).toLocaleDateString()}</span>
                <span>⏰ Expires: {new Date(alert.expires_at).toLocaleString()}</span>
              </div>

              {alert.donation_alert_recipients.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Routed to:</p>
                  <div className="flex flex-wrap gap-2">
                    {alert.donation_alert_recipients.map(r => (
                      <span key={r.id} className={`text-xs px-2 py-1 rounded-lg ${statusColor[r.response] ?? 'bg-gray-500/10 text-gray-400'}`}>
                        {r.food_banks?.name ?? 'Unknown'} — {r.response}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {alert.status === 'pending' && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => handleApprove(alert.id)}
                    disabled={approving === alert.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approving === alert.id ? 'Approving...' : '✅ Approve Donation'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
