'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

interface FoodBankProfile {
  id: string; name: string; capacity_kg: number | null;
  current_inventory_kg: number | null;
}

export default function InventoryPage(): React.ReactElement {
  const { user } = useUser();
  const [foodBankId, setFoodBankId] = useState<string | null>(null);
  const [profile, setProfile] = useState<FoodBankProfile | null>(null);
  const [newInventory, setNewInventory] = useState('');
  const [saving, setSaving] = useState(false);

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

  const fetchProfile = async (): Promise<void> => {
    if (!foodBankId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/food-banks/${foodBankId}`);
      if (res.ok) {
        const json = await res.json() as { data: FoodBankProfile };
        setProfile(json.data);
        setNewInventory(String(json.data.current_inventory_kg ?? 0));
      }
    } catch { /* empty */ }
  };

  useEffect(() => { fetchProfile(); }, [foodBankId]);

  const handleUpdate = async (): Promise<void> => {
    if (!foodBankId) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/food-banks/${foodBankId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_inventory_kg: Number(newInventory) }),
      });
      await fetchProfile();
    } catch { /* empty */ }
    setSaving(false);
  };

  const capacity = profile?.capacity_kg ?? 0;
  const inventory = profile?.current_inventory_kg ?? 0;
  const utilization = capacity > 0 ? Math.round((inventory / capacity) * 100) : 0;

  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl mb-1 text-[var(--color-text)]">Inventory Management</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Track and update your storage</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-base font-semibold mb-4 text-[var(--color-text)]">Current Inventory</h2>
          <div className="text-4xl font-bold text-[var(--color-primary)] mb-2">{inventory} kg</div>
          <div className="text-sm text-[var(--color-text-muted)] mb-4">
            of {capacity} kg capacity ({utilization}%)
          </div>
          <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(utilization, 100)}%`,
                backgroundColor: utilization > 80 ? 'var(--color-danger)' : utilization > 50 ? 'var(--color-warning)' : 'var(--color-primary)',
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-base font-semibold mb-4 text-[var(--color-text)]">Update Inventory</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Manually adjust if donations were distributed or new stock was received.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              value={newInventory}
              onChange={(e) => setNewInventory(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Current inventory (kg)"
            />
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
