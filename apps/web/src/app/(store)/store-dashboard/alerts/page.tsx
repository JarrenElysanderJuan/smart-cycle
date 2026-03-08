'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

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
  const [storeId, setStoreId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.sub) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/users/profile/${encodeURIComponent(user.sub)}`);
        if (res.ok) {
          const json = await res.json() as { data: { store_id?: string } };
          setStoreId(json.data?.store_id ?? null);
        }
      } catch { /* empty */ }
    })();
  }, [user?.sub]);

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
      const res = await fetch(`${API_BASE_URL}/api/v1/demo/approve-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId }),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch { /* empty */ }
    setApproving(null);
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    approved_by_store: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    routed: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
    accepted: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    picked_up: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    completed: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    expired: 'bg-[var(--color-text-light)]/10 text-[var(--color-text-light)]',
    cancelled: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
  };

  const priorityStyles: Record<string, string> = {
    critical: 'bg-[var(--color-critical)]/10 text-[var(--color-critical)]',
    high: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    medium: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    low: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  };

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl mb-1 text-[var(--color-text)]">Store Alerts</h1>
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
            <div key={alert.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary)]/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityStyles[alert.priority] ?? ''}`}>{alert.priority}</span>
                  <span className="font-medium text-[var(--color-text)]">{alert.bins?.label ?? 'Unknown bin'}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[alert.status] ?? ''}`}>
                  {alert.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)] mb-3">
                <span>{alert.estimated_weight_kg} kg</span>
                <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                <span>Expires: {new Date(alert.expires_at).toLocaleString()}</span>
              </div>

              {alert.donation_alert_recipients.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Routed to:</p>
                  <div className="flex flex-wrap gap-2">
                    {alert.donation_alert_recipients.map(r => (
                      <span key={r.id} className={`text-xs px-2 py-1 rounded-lg ${statusStyles[r.response] ?? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'}`}>
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
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {approving === alert.id ? 'Approving...' : 'Approve Donation'}
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
