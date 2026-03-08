'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/supabase';

const FOOD_TYPE_OPTIONS = ['produce', 'dairy', 'bakery', 'canned', 'frozen', 'meat', 'prepared'];
const DIETARY_OPTIONS = ['halal', 'kosher', 'vegan', 'vegetarian', 'gluten-free', 'nut-free'];

interface FoodBankFormData {
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: string;
  longitude: string;
  capacity_kg: string;
  pickup_capability: boolean;
  max_pickup_distance_km: string;
  avg_weekly_demand_kg: string;
  current_inventory_kg: string;
  service_area_radius_km: string;
  accepted_food_types: string[];
  dietary_restrictions: string[];
}

const initialForm: FoodBankFormData = {
  name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  latitude: '',
  longitude: '',
  capacity_kg: '',
  pickup_capability: false,
  max_pickup_distance_km: '',
  avg_weekly_demand_kg: '',
  current_inventory_kg: '0',
  service_area_radius_km: '',
  accepted_food_types: [],
  dietary_restrictions: [],
};

export default function RegisterFoodBankPage(): React.ReactElement {
  const [form, setForm] = useState<FoodBankFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name !== 'pickup_capability') {
      // Multi-select checkbox (food types / dietary)
      return;
    }
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const toggleArrayItem = (field: 'accepted_food_types' | 'dietary_restrictions', item: string): void => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = {
        organization_id: '00000000-0000-0000-0000-000000000000', // TODO: from Auth0 context
        name: form.name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone || undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        capacity_kg: form.capacity_kg ? parseFloat(form.capacity_kg) : undefined,
        pickup_capability: form.pickup_capability,
        max_pickup_distance_km: form.max_pickup_distance_km
          ? parseFloat(form.max_pickup_distance_km) : undefined,
        avg_weekly_demand_kg: form.avg_weekly_demand_kg
          ? parseFloat(form.avg_weekly_demand_kg) : undefined,
        current_inventory_kg: parseFloat(form.current_inventory_kg) || 0,
        service_area_radius_km: form.service_area_radius_km
          ? parseFloat(form.service_area_radius_km) : undefined,
        accepted_food_types: form.accepted_food_types.length > 0 ? form.accepted_food_types : undefined,
        dietary_restrictions: form.dietary_restrictions.length > 0 ? form.dietary_restrictions : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/food-banks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Register a Food Bank</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">
        Add a food bank to the Smart Cycle distribution network
      </p>

      {success && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 text-[var(--color-success)]">
          ✅ Food bank registered successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Section title="Food Bank Information">
          <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Email" name="contact_email" value={form.contact_email} onChange={handleChange} type="email" required />
            <Field label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} type="tel" />
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <Field label="Street Address" name="address" value={form.address} onChange={handleChange} required />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" name="city" value={form.city} onChange={handleChange} required />
            <Field label="State" name="state" value={form.state} onChange={handleChange} required />
            <Field label="ZIP Code" name="zip_code" value={form.zip_code} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} type="number" placeholder="40.7128" />
            <Field label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} type="number" placeholder="-74.0060" />
          </div>
        </Section>

        {/* Capacity & Demand */}
        <Section title="Capacity & Demand">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Max Capacity (kg)" name="capacity_kg" value={form.capacity_kg} onChange={handleChange} type="number" placeholder="500" />
            <Field label="Avg Weekly Demand (kg)" name="avg_weekly_demand_kg" value={form.avg_weekly_demand_kg} onChange={handleChange} type="number" placeholder="300" />
            <Field label="Current Inventory (kg)" name="current_inventory_kg" value={form.current_inventory_kg} onChange={handleChange} type="number" />
          </div>
          <Field label="Service Area Radius (km)" name="service_area_radius_km" value={form.service_area_radius_km} onChange={handleChange} type="number" placeholder="15" />
        </Section>

        {/* Pickup */}
        <Section title="Pickup Capability">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="pickup_capability"
              checked={form.pickup_capability}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <label className="text-sm">This food bank can pick up donations</label>
          </div>
          {form.pickup_capability && (
            <Field label="Max Pickup Distance (km)" name="max_pickup_distance_km" value={form.max_pickup_distance_km} onChange={handleChange} type="number" placeholder="25" />
          )}
        </Section>

        {/* Food Preferences */}
        <Section title="Accepted Food Types">
          <div className="flex flex-wrap gap-2">
            {FOOD_TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleArrayItem('accepted_food_types', type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  form.accepted_food_types.includes(type)
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30'
                    : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Dietary Restrictions">
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleArrayItem('dietary_restrictions', type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  form.dietary_restrictions.includes(type)
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30'
                    : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-[var(--color-primary)] text-[var(--color-bg)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register Food Bank'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-md font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label, name, value, onChange, type = 'text', required = false, placeholder
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}): React.ReactElement {
  return (
    <div>
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />
    </div>
  );
}
