'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/supabase';

/**
 * Food Bank Inventory Page
 *
 * Shows current inventory with update form and accepted donation history.
 * TODO: [AUTH0] Scope by authenticated user's food_bank_id.
 */

// TODO: [AUTH0] Replace with value from user session
const DEMO_FOOD_BANK_ID = 'd0000000-0000-0000-0000-000000000001';

interface FoodBankProfile {
  id: string; name: string; capacity_kg: number | null;
  current_inventory_kg: number | null;
}

export default function InventoryPage(): React.ReactElement {
  const [profile, setProfile] = useState<FoodBankProfile | null>(null);
  const [newInventory, setNewInventory] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/food-banks/${DEMO_FOOD_BANK_ID}`);
      if (res.ok) {
        const json = await res.json() as { data: FoodBankProfile };
        setProfile(json.data);
        setNewInventory(String(json.data.current_inventory_kg ?? 0));
      }
    } catch { /* empty */ }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpdate = async (): Promise<void> => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/food-banks/${DEMO_FOOD_BANK_ID}`, {
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
    <div>
      <h1 className="text-2xl font-bold mb-1">Inventory Management</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Track and update your storage</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current status */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold mb-4">Current Inventory</h2>
          <div className="text-4xl font-bold text-blue-400 mb-2">{inventory} kg</div>
          <div className="text-sm text-[var(--color-text-muted)] mb-4">
            of {capacity} kg capacity ({utilization}%)
          </div>
          <div className="w-full bg-[var(--color-bg)] rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Update form */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold mb-4">Update Inventory</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Manually adjust if donations were distributed or new stock was received.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              value={newInventory}
              onChange={(e) => setNewInventory(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
              placeholder="Current inventory (kg)"
            />
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
