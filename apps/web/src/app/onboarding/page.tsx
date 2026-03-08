'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@/lib/supabase';

type BusinessType = 'store' | 'food_bank' | null;

export default function OnboardingPage(): React.ReactElement {
  const { user } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [businessType, setBusinessType] = useState<BusinessType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Store form
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [storeState, setStoreState] = useState('');
  const [storeZip, setStoreZip] = useState('');
  const [storeType, setStoreType] = useState('grocery');
  const [storeContactName, setStoreContactName] = useState('');
  const [storeContactEmail, setStoreContactEmail] = useState('');
  const [storeContactPhone, setStoreContactPhone] = useState('');


  // Food bank form
  const [fbName, setFbName] = useState('');
  const [fbAddress, setFbAddress] = useState('');
  const [fbCity, setFbCity] = useState('');
  const [fbState, setFbState] = useState('');
  const [fbZip, setFbZip] = useState('');
  const [fbContactEmail, setFbContactEmail] = useState('');
  const [fbContactPhone, setFbContactPhone] = useState('');
  const [fbCapacity, setFbCapacity] = useState('');
  const [fbPickup, setFbPickup] = useState(false);
  const [fbMaxPickupDist, setFbMaxPickupDist] = useState('');
  const [fbServiceRadius, setFbServiceRadius] = useState('');
  const [fbWeeklyDemand, setFbWeeklyDemand] = useState('');


  /** Create an organization via the backend API (bypasses RLS). */
  const createOrganization = async (name: string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create organization');
    }
    const json = await res.json() as { data: { id: string } };
    return json.data.id;
  };

  const handleSelectRole = (type: BusinessType) => {
    setBusinessType(type);
    setStep(2);
  };

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create organization
      const orgId = await createOrganization(storeName);

      // 2. Create store under that org
      const res = await fetch(`${API_BASE_URL}/api/v1/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          name: storeName,
          address: storeAddress,
          city: storeCity,
          state: storeState,
          zip_code: storeZip,
          store_type: storeType,
          contact_name: storeContactName,
          contact_email: storeContactEmail || user?.email || '',
          contact_phone: storeContactPhone || undefined,

        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register store');
      }

      const storeData = await res.json() as { data: { id: string } };

      // 3. Save user profile with role + entity link
      if (user?.sub) {
        await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth0_id: user.sub,
            role: 'store_manager',
            store_id: storeData.data.id,
            organization_id: orgId,
          }),
        });
      }

      setSuccess(true);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFoodBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create organization
      const orgId = await createOrganization(fbName);

      // 2. Create food bank under that org
      const res = await fetch(`${API_BASE_URL}/api/v1/food-banks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          name: fbName,
          address: fbAddress,
          city: fbCity,
          state: fbState,
          zip_code: fbZip,
          contact_email: fbContactEmail || user?.email || '',
          contact_phone: fbContactPhone || undefined,
          capacity_kg: fbCapacity ? parseFloat(fbCapacity) : undefined,
          pickup_capability: fbPickup,
          max_pickup_distance_km: fbMaxPickupDist ? parseFloat(fbMaxPickupDist) : undefined,
          service_area_radius_km: fbServiceRadius ? parseFloat(fbServiceRadius) : undefined,
          avg_weekly_demand_kg: fbWeeklyDemand ? parseFloat(fbWeeklyDemand) : undefined,
          current_inventory_kg: 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register food bank');
      }

      const fbData = await res.json() as { data: { id: string } };

      // 3. Save user profile with role + entity link
      if (user?.sub) {
        await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth0_id: user.sub,
            role: 'food_bank_coordinator',
            food_bank_id: fbData.data.id,
            organization_id: orgId,
          }),
        });
      }

      setSuccess(true);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center px-6">
      <div className="max-w-2xl w-full fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl mb-2">♻️ Welcome to Smart Cycle</h1>
          <p className="text-[var(--color-text-muted)]">
            {user ? `Hi ${user.name ?? user.email}! Let's set up your account.` : 'Let\'s get you set up.'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                s <= step
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'
              }`}>
                {s === 3 && success ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)] text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Role */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-center mb-2">What type of organization are you?</h2>
            <p className="text-sm text-[var(--color-text-muted)] text-center mb-8">
              This determines your dashboard and features
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectRole('store')}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-left hover:border-[var(--color-primary)]/40 hover:shadow-lg transition-all group cursor-pointer"
              >
                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">🏪</span>
                <h3 className="font-[family-name:var(--font-display)] text-lg mb-1">Grocery Store</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  I manage a store and want to donate surplus food using smart bins
                </p>
                <div className="mt-4 text-xs text-[var(--color-primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  → Set up store dashboard
                </div>
              </button>
              <button
                onClick={() => handleSelectRole('food_bank')}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-left hover:border-[var(--color-accent)]/40 hover:shadow-lg transition-all group cursor-pointer"
              >
                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">🏦</span>
                <h3 className="font-[family-name:var(--font-display)] text-lg mb-1">Food Bank</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  I coordinate a food bank and want to receive donations from nearby stores
                </p>
                <div className="mt-4 text-xs text-[var(--color-accent)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  → Set up food bank dashboard
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Business Details — Store */}
        {step === 2 && businessType === 'store' && (
          <form onSubmit={handleSubmitStore} className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer">← Back</button>
              <h2 className="text-xl font-semibold">Register Your Store</h2>
            </div>

            <Section title="Store Information">
              <Field label="Store Name" value={storeName} onChange={setStoreName} required placeholder="e.g. FreshMart Downtown" />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Store Type" value={storeType} onChange={setStoreType}
                  options={[{ value: 'grocery', label: 'Grocery' }, { value: 'warehouse', label: 'Warehouse' }, { value: 'specialty', label: 'Specialty' }]}
                />
                <Field label="Contact Name" value={storeContactName} onChange={setStoreContactName} required placeholder="Store Manager" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Email" value={storeContactEmail} onChange={setStoreContactEmail} type="email" placeholder={user?.email as string || ''} />
                <Field label="Contact Phone" value={storeContactPhone} onChange={setStoreContactPhone} type="tel" placeholder="(555) 123-4567" />
              </div>
            </Section>

            <Section title="Location">
              <Field label="Street Address" value={storeAddress} onChange={setStoreAddress} required placeholder="123 Main St" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" value={storeCity} onChange={setStoreCity} required />
                <Field label="State" value={storeState} onChange={setStoreState} required />
                <Field label="ZIP" value={storeZip} onChange={setStoreZip} required />
              </div>

            </Section>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Registering...' : 'Register Store & Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Business Details — Food Bank */}
        {step === 2 && businessType === 'food_bank' && (
          <form onSubmit={handleSubmitFoodBank} className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer">← Back</button>
              <h2 className="text-xl font-semibold">Register Your Food Bank</h2>
            </div>

            <Section title="Food Bank Information">
              <Field label="Name" value={fbName} onChange={setFbName} required placeholder="e.g. Community Food Bank of NYC" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Email" value={fbContactEmail} onChange={setFbContactEmail} type="email" placeholder={user?.email as string || ''} />
                <Field label="Contact Phone" value={fbContactPhone} onChange={setFbContactPhone} type="tel" placeholder="(555) 123-4567" />
              </div>
            </Section>

            <Section title="Location">
              <Field label="Street Address" value={fbAddress} onChange={setFbAddress} required placeholder="456 Elm Ave" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" value={fbCity} onChange={setFbCity} required />
                <Field label="State" value={fbState} onChange={setFbState} required />
                <Field label="ZIP" value={fbZip} onChange={setFbZip} required />
              </div>

            </Section>

            <Section title="Operations">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Storage Capacity (kg)" value={fbCapacity} onChange={setFbCapacity} type="number" placeholder="e.g. 500" />
                <Field label="Avg. Weekly Demand (kg)" value={fbWeeklyDemand} onChange={setFbWeeklyDemand} type="number" placeholder="e.g. 200" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" checked={fbPickup} onChange={(e) => setFbPickup(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500" id="pickup" />
                <label htmlFor="pickup" className="text-sm">We can pick up donations from stores</label>
              </div>
              {fbPickup && (
                <Field label="Max Pickup Distance (km)" value={fbMaxPickupDist} onChange={setFbMaxPickupDist} type="number" placeholder="e.g. 25" />
              )}
              {!fbPickup && (
                <Field label="Service Area Radius (km)" value={fbServiceRadius} onChange={setFbServiceRadius} type="number" placeholder="e.g. 15" />
              )}
            </Section>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-[var(--color-accent)] text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Registering...' : 'Register Food Bank & Continue'}
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl mb-2">You&apos;re All Set!</h2>
            <p className="text-[var(--color-text-muted)] mb-8">
              Your {businessType === 'store' ? 'store' : 'food bank'} has been registered and your account is linked.
            </p>
            <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 mb-8 text-left">
              <p className="text-sm text-[var(--color-success)] font-medium mb-1">✅ Account Ready</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Your <strong>{businessType === 'store' ? 'store_manager' : 'food_bank_coordinator'}</strong> role
                has been saved. Click below to access your dashboard.
              </p>
            </div>
            <button
              onClick={() => {
                window.location.href = businessType === 'store' ? '/store-dashboard' : '/food-bank-dashboard';
              }}
              className="px-8 py-3.5 rounded-2xl text-base font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              {businessType === 'store' ? 'Go to Store Dashboard' : 'Go to Food Bank Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-sm font-semibold mb-4 text-[var(--color-text-muted)] uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
