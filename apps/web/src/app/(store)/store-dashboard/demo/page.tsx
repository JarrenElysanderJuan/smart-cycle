'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

interface StepResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export default function DemoPage(): React.ReactElement {
  const { user } = useUser();
  const [storeId, setStoreId] = useState('');
  const [binId, setBinId] = useState('');
  const [alertId, setAlertId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, StepResult>>({});

  const addResult = (key: string, result: StepResult) => {
    setResults((prev) => ({ ...prev, [key]: result }));
  };

  // Step 0: We need the store ID — fetch from user profile
  const fetchStoreId = async () => {
    if (storeId) return storeId;
    if (!user?.sub) return '';
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/profile/${encodeURIComponent(user.sub)}`);
      if (res.ok) {
        const json = await res.json() as { data: { store_id?: string } };
        const id = json.data?.store_id ?? '';
        if (id) setStoreId(id);
        return id;
      }
    } catch { /* ignore */ }
    return '';
  };

  const handleCreateBin = async () => {
    setLoading('create-bin');
    try {
      const sid = await fetchStoreId();
      if (!sid) { addResult('create-bin', { success: false, message: 'No store ID found in your profile' }); return; }

      const res = await fetch(`${API_BASE_URL}/api/v1/demo/create-bin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: sid, label: `Demo-${Date.now().toString(36).toUpperCase()}` }),
      });
      const json = await res.json();
      if (res.ok) {
        setBinId(json.data.id);
        addResult('create-bin', { success: true, message: `✅ Bin "${json.data.label}" created`, data: json.data });
      } else {
        addResult('create-bin', { success: false, message: json.error || 'Failed' });
      }
    } catch (err) {
      addResult('create-bin', { success: false, message: (err as Error).message });
    } finally { setLoading(null); }
  };

  const handleSimulate = async (scenario: string) => {
    setLoading('simulate');
    try {
      if (!binId) { addResult('simulate', { success: false, message: 'Create a bin first' }); return; }

      const res = await fetch(`${API_BASE_URL}/api/v1/demo/simulate-telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bin_id: binId, scenario }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.alert_id) setAlertId(json.alert_id);
        addResult('simulate', {
          success: true,
          message: json.alert_generated
            ? `🚨 Alert generated! Priority: ${json.alert_priority}`
            : `📊 Telemetry recorded — freshness: ${json.freshness_score.toFixed(2)} (no alert)`,
          data: json,
        });
      } else {
        addResult('simulate', { success: false, message: json.error || 'Failed' });
      }
    } catch (err) {
      addResult('simulate', { success: false, message: (err as Error).message });
    } finally { setLoading(null); }
  };

  const handleApprove = async () => {
    setLoading('approve');
    try {
      if (!alertId) { addResult('approve', { success: false, message: 'Simulate a ripe reading first to generate an alert' }); return; }

      const res = await fetch(`${API_BASE_URL}/api/v1/demo/approve-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId }),
      });
      const json = await res.json();
      if (res.ok) {
        addResult('approve', {
          success: true,
          message: `✅ Alert approved → routed to ${json.routed_to_food_banks} food bank(s)`,
          data: json,
        });
      } else {
        addResult('approve', { success: false, message: json.error || 'Failed' });
      }
    } catch (err) {
      addResult('approve', { success: false, message: (err as Error).message });
    } finally { setLoading(null); }
  };

  const handleMakeAdmin = async () => {
    setLoading('admin');
    try {
      if (!user?.sub) { addResult('admin', { success: false, message: 'Not logged in' }); return; }

      const res = await fetch(`${API_BASE_URL}/api/v1/demo/make-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth0_id: user.sub }),
      });
      const json = await res.json();
      if (res.ok) {
        addResult('admin', { success: true, message: '👑 Admin role assigned! Log out and back in, or visit /admin', data: json });
      } else {
        addResult('admin', { success: false, message: json.error || 'Failed' });
      }
    } catch (err) {
      addResult('admin', { success: false, message: (err as Error).message });
    } finally { setLoading(null); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">🧪 Demo Controls</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">
        Walk through the full donation lifecycle: bin → telemetry → alert → food bank
      </p>

      <div className="space-y-4">
        {/* Step 1 */}
        <DemoStep
          number={1}
          title="Create a Smart Bin"
          description="Register a demo IoT bin at your store"
          actionLabel="🗑️ Create Bin"
          onAction={handleCreateBin}
          loading={loading === 'create-bin'}
          result={results['create-bin']}
          completed={!!binId}
        />

        {/* Step 2 */}
        <DemoStep
          number={2}
          title="Simulate Telemetry"
          description="Send a simulated reading from your bin"
          loading={loading === 'simulate'}
          result={results['simulate']}
          completed={!!alertId}
          customActions={
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleSimulate('normal')} disabled={!binId || !!loading}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 cursor-pointer">
                📊 Normal (no alert)
              </button>
              <button onClick={() => handleSimulate('ripe')} disabled={!binId || !!loading}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-40 cursor-pointer">
                🍌 Ripe (medium alert)
              </button>
              <button onClick={() => handleSimulate('critical')} disabled={!binId || !!loading}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40 cursor-pointer">
                🔴 Critical (urgent alert)
              </button>
            </div>
          }
        />

        {/* Step 3 */}
        <DemoStep
          number={3}
          title="Approve & Route to Food Banks"
          description="Approve the alert and route the donation to nearby food banks"
          actionLabel="✅ Approve Alert"
          onAction={handleApprove}
          loading={loading === 'approve'}
          result={results['approve']}
          completed={results['approve']?.success ?? false}
          disabled={!alertId}
        />
      </div>

      {/* Admin shortcut */}
      <div className="mt-10 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
        <h3 className="text-sm font-semibold text-purple-400 mb-2">👑 Make Yourself Admin</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Grant admin role to your account for accessing the admin dashboard at <code>/admin</code>.
        </p>
        <button onClick={handleMakeAdmin} disabled={!!loading}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-40 cursor-pointer">
          {loading === 'admin' ? 'Assigning...' : '👑 Make Me Admin'}
        </button>
        {results['admin'] && (
          <p className={`mt-2 text-xs ${results['admin'].success ? 'text-emerald-400' : 'text-red-400'}`}>
            {results['admin'].message}
          </p>
        )}
      </div>
    </div>
  );
}

function DemoStep({
  number, title, description, actionLabel, onAction, loading, result, completed, disabled, customActions,
}: {
  number: number; title: string; description: string;
  actionLabel?: string; onAction?: () => void;
  loading: boolean; result?: StepResult; completed: boolean;
  disabled?: boolean; customActions?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-6 transition-all ${
      completed
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-[var(--color-border)] bg-[var(--color-surface)]'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          completed ? 'bg-emerald-500 text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'
        }`}>
          {completed ? '✓' : number}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">{description}</p>

          {customActions ?? (
            onAction && (
              <button onClick={onAction} disabled={disabled || loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors disabled:opacity-40 cursor-pointer">
                {loading ? 'Working...' : actionLabel}
              </button>
            )
          )}

          {result && (
            <div className={`mt-3 p-3 rounded-lg text-xs ${
              result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {result.message}
              {result.data && (
                <pre className="mt-2 text-[10px] opacity-70 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
