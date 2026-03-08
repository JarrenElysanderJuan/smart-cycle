'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TelemetryReading {
  id: string;
  recorded_at: string;
  temperature_c: number;
  gas_ppm: number;
  weight_kg: number;
  battery_level: number;
  freshness_score: number | null;
}

interface BinDetail {
  id: string;
  label: string;
  status: string;
  store_address: string | null;
  location_description: string | null;
  last_seen_at: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export default function BinDetailPage({
  params,
}: {
  params: Promise<{ binId: string }>;
}): React.ReactElement {
  const [binId, setBinId] = useState<string | null>(null);
  const [bin, setBin] = useState<BinDetail | null>(null);
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setBinId(p.binId));
  }, [params]);

  useEffect(() => {
    if (!binId) return;

    async function fetchData(): Promise<void> {
      try {
        const [binRes, telemetryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/bins/${binId}`),
          fetch(`${API_BASE_URL}/api/v1/bins/${binId}/telemetry?limit=100`),
        ]);

        if (binRes.ok) {
          const binJson = await binRes.json() as { data: BinDetail };
          setBin(binJson.data);
        }
        if (telemetryRes.ok) {
          const telemetryJson = await telemetryRes.json() as { data: TelemetryReading[] };
          // Reverse so chart shows oldest → newest (left to right)
          setReadings(telemetryJson.data.reverse());
        }
      } catch (err) {
        console.error('Failed to fetch bin data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [binId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-muted)]">Loading...</div>
      </div>
    );
  }

  if (!bin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-muted)]">Bin not found</div>
      </div>
    );
  }

  const latestReading = readings[readings.length - 1];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{bin.label}</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {bin.store_address ?? 'No address'} • {bin.location_description ?? ''}
          </p>
        </div>
        <StatusBadge status={bin.status} />
      </div>

      {/* Live Stats */}
      {latestReading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            label="Temperature"
            value={`${latestReading.temperature_c.toFixed(1)}°C`}
            icon="🌡️"
            color={latestReading.temperature_c > 8 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}
          />
          <MetricCard
            label="Gas (PPM)"
            value={latestReading.gas_ppm.toFixed(1)}
            icon="💨"
            color={latestReading.gas_ppm > 200 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}
          />
          <MetricCard
            label="Weight"
            value={`${latestReading.weight_kg.toFixed(1)} kg`}
            icon="⚖️"
          />
          <MetricCard
            label="Battery"
            value={`${latestReading.battery_level}%`}
            icon="🔋"
            color={latestReading.battery_level < 20 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}
          />
          <MetricCard
            label="Freshness"
            value={latestReading.freshness_score?.toFixed(2) ?? 'N/A'}
            icon="🍃"
            color={
              latestReading.freshness_score !== null && latestReading.freshness_score < 0.5
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--color-success)]'
            }
          />
        </div>
      )}

      {/* Charts */}
      {readings.length > 0 ? (
        <div className="space-y-6">
          <ChartCard title="Temperature & Gas">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="recorded_at"
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis yAxisId="temp" stroke="#22d3ee" fontSize={12} />
                <YAxis yAxisId="gas" orientation="right" stroke="#fbbf24" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #1f2937', borderRadius: 8 }}
                  labelFormatter={(v: string) => new Date(v).toLocaleString()}
                />
                <Legend />
                <Line yAxisId="temp" type="monotone" dataKey="temperature_c" name="Temp (°C)" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line yAxisId="gas" type="monotone" dataKey="gas_ppm" name="Gas (PPM)" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Weight & Freshness Score">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="recorded_at"
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis yAxisId="weight" stroke="#34d399" fontSize={12} />
                <YAxis yAxisId="score" orientation="right" domain={[0, 1]} stroke="#a78bfa" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2332', border: '1px solid #1f2937', borderRadius: 8 }}
                  labelFormatter={(v: string) => new Date(v).toLocaleString()}
                />
                <Legend />
                <Line yAxisId="weight" type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line yAxisId="score" type="monotone" dataKey="freshness_score" name="Freshness" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-text-muted)]">
          <p className="text-4xl mb-4">📡</p>
          <p className="text-lg font-medium">No telemetry data yet</p>
          <p className="text-sm mt-1">Data will appear here once the bin starts reporting</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-md font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const styles: Record<string, string> = {
    online: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
    offline: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20',
    maintenance: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status] ?? ''}`}>
      {status}
    </span>
  );
}
