'use client';

import dynamic from 'next/dynamic';

/**
 * Store Dashboard Map Page — client component.
 *
 * Dynamically imports the Leaflet map to ensure it only renders on the client,
 * avoiding Next.js SSR document/window undefined errors.
 */

const DynamicFoodBankMap = dynamic(
  () => import('@/components/FoodBankMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[600px] flex items-center justify-center border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">
        <p className="text-[var(--color-text-muted)]">Initializing map...</p>
      </div>
    )
  }
);

export default function StoreMapPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Local Food Banks</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">View nearby food partner locations and capacities.</p>

      <DynamicFoodBankMap />
    </div>
  );
}
