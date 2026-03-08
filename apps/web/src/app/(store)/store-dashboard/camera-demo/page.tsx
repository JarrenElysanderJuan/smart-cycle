'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

interface Bin {
  id: string;
  label: string;
  status: string;
}

export default function CameraDemoPage(): React.ReactElement {
  const { user } = useUser();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Fetch store_id
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

  const fetchBins = async (): Promise<void> => {
    if (!storeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/stores/${storeId}/bins`);
      if (res.ok) {
        const json = await res.json() as { data: Bin[] };
        // We only want to show bins created for the camera demo
        setBins(json.data.filter(b => b.label.includes('Camera')));
      }
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchBins(); }, [storeId]);

  const handleCreateBin = async (): Promise<void> => {
    if (!storeId) return;
    setActing('create');
    try {
      // Use existing demo endpoint to create a bin, but give it a specific label
      await fetch(`${API_BASE_URL}/api/v1/demo/create-bin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, label: 'Camera Demo Bin' }),
      });
      await fetchBins();
    } catch { /* empty */ }
    setActing(null);
  };

  const handleCapture = async (binId: string): Promise<void> => {
    setActing(binId);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/demo/camera/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bin_id: binId }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    }
    setActing(null);
  };

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl mb-1">Live Camera Demo</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Test the partner&apos;s AI vision integration.</p>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      ) : bins.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">No camera-linked bins exist for your store.</p>
          <button
            onClick={handleCreateBin}
            disabled={acting === 'create'}
            className="px-6 py-3 rounded-lg font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {acting === 'create' ? 'Creating...' : '+ Create Camera Bin'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bins.map(bin => (
            <div key={bin.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col items-center">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="font-[family-name:var(--font-display)] text-lg mb-1">{bin.label}</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">Linked to external IP webcam feed</p>
              
              <button
                onClick={() => handleCapture(bin.id)}
                disabled={acting === bin.id}
                className="px-6 py-3 w-full max-w-sm rounded-xl font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 transition-all disabled:opacity-50 flex justify-center items-center gap-2 disabled:hover:scale-100 cursor-pointer"
              >
                {acting === bin.id ? (
                  <>
                    <span className="animate-spin text-xl">⏳</span>
                     Capturing & Processing...
                  </>
                ) : '📸 Capture & Classify'}
              </button>

              {result && (
                <div className={`mt-6 w-full max-w-sm p-4 rounded-lg text-sm border ${result.error ? 'border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5' : 'border-[var(--color-success)]/20 bg-[var(--color-success)]/5'}`}>
                  {result.error ? (
                    <p className="text-[var(--color-danger)] font-medium whitespace-pre-wrap">{result.error}</p>
                  ) : (
                    <div className="space-y-2 text-[var(--color-text)]">
                       <p className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
                         <span className="font-medium text-[var(--color-text-muted)]">Model Prediction:</span> 
                         <span className="font-bold uppercase rounded px-2 py-0.5 bg-[var(--color-surface-elevated)]">{result.prediction}</span>
                       </p>
                       <p className="flex justify-between items-center">
                         <span className="font-medium text-[var(--color-text-muted)]">System Mapped Score:</span> 
                         <span className="font-mono">{result.freshness_score}</span>
                       </p>
                       <p className="flex justify-between items-center">
                         <span className="font-medium text-[var(--color-text-muted)]">Action Taken:</span> 
                         <span className={result.alert_generated ? 'text-[var(--color-warning)] font-bold' : 'text-[var(--color-success)] font-bold'}>
                           {result.alert_generated ? 'Alert Generated🚨' : 'No action needed ✅'}
                         </span>
                       </p>
                       {result.alert_priority && (
                         <p className="flex justify-between items-center text-xs text-[var(--color-warning)]">
                           <span>Priority classification:</span>
                           <span className="uppercase">{result.alert_priority}</span>
                         </p>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
