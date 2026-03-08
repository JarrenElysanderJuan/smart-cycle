/**
 * Geocoding utility — converts addresses to lat/lng coordinates.
 *
 * Uses the free OpenStreetMap Nominatim API.
 * https://nominatim.org/release-docs/develop/api/Search/
 *
 * Note: Nominatim has a rate limit of 1 request/second.
 * For a hackathon this is fine. For production, use Google Maps or Mapbox.
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address string to lat/lng coordinates.
 * Returns null if geocoding fails (the caller should handle gracefully).
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode: string
): Promise<GeocodingResult | null> {
  const query = `${address}, ${city}, ${state} ${zipCode}`;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a valid User-Agent
        'User-Agent': 'SmartCycle-Hackathon/1.0',
      },
    });

    if (!res.ok) {
      console.warn(`Geocoding failed (HTTP ${res.status}) for: ${query}`);
      return null;
    }

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;

    if (results.length === 0) {
      console.warn(`No geocoding results for: ${query}`);
      return null;
    }

    const first = results[0];
    if (!first) return null;

    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
    };
  } catch (err) {
    console.warn('Geocoding error:', err);
    return null;
  }
}
