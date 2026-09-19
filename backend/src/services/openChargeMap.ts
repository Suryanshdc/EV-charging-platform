import { env } from '../config/env';

const OCM_BASE_URL = 'https://api.openchargemap.io/v3/poi';

export interface OcmStation {
  externalId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
  connectors: string[];
}

interface OcmConnection {
  ConnectionType?: { Title?: string };
  PowerKW?: number;
}

interface OcmPoi {
  ID: number;
  AddressInfo: {
    Title: string;
    AddressLine1?: string;
    Town?: string;
    Latitude: number;
    Longitude: number;
  };
  Connections?: OcmConnection[];
}

// Maps Open Charge Map's free-text connector names to our own ConnectorType enum.
// OCM's naming isn't standardized, so this is a best-effort keyword match.
function normalizeConnector(title?: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('ccs')) return 'CCS2';
  if (t.includes('chademo')) return 'CHADEMO';
  if (t.includes('type 2') || t.includes('type2') || t.includes('mennekes')) return 'TYPE2';
  return null;
}

/**
 * Fetches real, live public charging stations near a coordinate from Open
 * Charge Map (https://openchargemap.org) — a free, community-maintained,
 * global database of EV charging locations. This covers cars well; two-wheeler
 * charging infrastructure isn't tracked by OCM, so that data is seeded
 * separately (see prisma/seed.ts) and merged with these results by the caller.
 */
export async function fetchNearbyStations(
  latitude: number,
  longitude: number,
  distanceKm = 10,
  maxResults = 25
): Promise<OcmStation[]> {
  const params = new URLSearchParams({
    output: 'json',
    latitude: String(latitude),
    longitude: String(longitude),
    distance: String(distanceKm),
    distanceunit: 'KM',
    maxresults: String(maxResults),
    compact: 'true',
    verbose: 'false',
  });
  if (env.openChargeMapApiKey) {
    params.set('key', env.openChargeMapApiKey);
  }

  const res = await fetch(`${OCM_BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Open Charge Map request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as OcmPoi[];

  return data
    .filter((poi) => poi.AddressInfo?.Latitude && poi.AddressInfo?.Longitude)
    .map((poi) => {
      const connectors = (poi.Connections ?? [])
        .map((c) => normalizeConnector(c.ConnectionType?.Title))
        .filter((c): c is string => Boolean(c));

      const maxPower = Math.max(0, ...(poi.Connections ?? []).map((c) => c.PowerKW ?? 0));

      return {
        externalId: `ocm-${poi.ID}`,
        name: poi.AddressInfo.Title,
        address: [poi.AddressInfo.AddressLine1, poi.AddressInfo.Town].filter(Boolean).join(', '),
        latitude: poi.AddressInfo.Latitude,
        longitude: poi.AddressInfo.Longitude,
        powerKw: maxPower || 22,
        connectors: connectors.length > 0 ? connectors : ['TYPE2'],
      };
    });
}
