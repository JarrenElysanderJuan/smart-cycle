'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '@/lib/supabase';
import L from 'leaflet';

// Fix for default Leaflet marker icons in Next.js
// Next.js static asset serving doesn't align with leaflet's defaults
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface FoodBankProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  capacity_kg: number;
  current_inventory_kg: number;
}

export default function FoodBankMap() {
  const [foodBanks, setFoodBanks] = useState<FoodBankProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFoodBanks() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/food-banks`);
        if (res.ok) {
          const json = await res.json() as { data: FoodBankProfile[] };
          // Filter to only those with valid coordinates
          setFoodBanks(json.data.filter((fb) => fb.latitude !== null && fb.longitude !== null));
        }
      } catch (err) {
        console.error('Failed to fetch food banks for map', err);
      }
      setLoading(false);
    }
    fetchFoodBanks();
  }, []);

  if (loading) {
    return <div className="h-[500px] flex items-center justify-center border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">Loading map...</div>;
  }

  // Check if we have any food banks with coordinates. If not, default to North America center.
  const centerPosition: [number, number] = foodBanks.length > 0
    ? [Number(foodBanks[0].latitude), Number(foodBanks[0].longitude)]
    : [39.8283, -98.5795]; // Default to US center
  const zoomLevel = foodBanks.length > 0 ? 10 : 4;

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm">
      <MapContainer center={centerPosition} zoom={zoomLevel} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {foodBanks.map((fb) => (
          <Marker key={fb.id} position={[Number(fb.latitude), Number(fb.longitude)]}>
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-sm mb-1">{fb.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{fb.address}, {fb.city}, {fb.state}</p>
                <div className="text-xs">
                  <span className="font-semibold">Capacity:</span> {fb.current_inventory_kg ?? 0} / {fb.capacity_kg ?? 0} kg
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
