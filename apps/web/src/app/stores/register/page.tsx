'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/supabase';

interface StoreFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: string;
  longitude: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  store_type: string;
  average_daily_waste_kg: string;
}

const initialForm: StoreFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  latitude: '',
  longitude: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  store_type: 'grocery',
  average_daily_waste_kg: '',
};

export default function RegisterStorePage(): React.ReactElement {
  const [form, setForm] = useState<StoreFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = {
        organization_id: '00000000-0000-0000-0000-000000000000', // TODO: from Auth0 context
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone || undefined,
        store_type: form.store_type,
        average_daily_waste_kg: form.average_daily_waste_kg
          ? parseFloat(form.average_daily_waste_kg)
          : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/stores`, {
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
      <h1 className="text-2xl font-bold mb-1">Register a Store</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">
        Add a new grocery store to the Smart Cycle network
      </p>

      {success && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 text-[var(--color-success)]">
          ✅ Store registered successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Info */}
        <Section title="Store Information">
          <Field label="Store Name" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Store Type" name="store_type" value={form.store_type} onChange={handleChange} type="select"
            options={[
              { value: 'grocery', label: 'Grocery' },
              { value: 'warehouse', label: 'Warehouse' },
              { value: 'specialty', label: 'Specialty' },
            ]}
          />
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

        {/* Contact */}
        <Section title="Contact Information">
          <Field label="Contact Name" name="contact_name" value={form.contact_name} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Email" name="contact_email" value={form.contact_email} onChange={handleChange} type="email" required />
            <Field label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} type="tel" />
          </div>
        </Section>

        {/* Operational */}
        <Section title="Operational Data">
          <Field label="Estimated Daily Waste (kg)" name="average_daily_waste_kg" value={form.average_daily_waste_kg} onChange={handleChange} type="number" placeholder="25" />
        </Section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-[var(--color-primary)] text-[var(--color-bg)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register Store'}
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
  label, name, value, onChange, type = 'text', required = false, placeholder, options
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}): React.ReactElement {
  const baseStyles = 'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors';

  return (
    <div>
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      {type === 'select' && options ? (
        <select name={name} value={value} onChange={onChange} className={baseStyles}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={baseStyles}
        />
      )}
    </div>
  );
}
