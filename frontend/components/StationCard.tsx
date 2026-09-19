'use client';

import { IndianRupee } from 'lucide-react';
import type { Station } from '@/lib/api';
import { Chip } from './ui/Badge';
import { Navigation } from 'lucide-react';

export function StationCard({
  station,
  selected,
  onSelect,
  myConnector,
}: {
  station: Station;
  selected: boolean;
  onSelect: (id: string) => void;
  myConnector?: string;
}) {
  const statusHex: Record<Station['status'], string> = {
    AVAILABLE: '#34D399',
    CHARGING: '#FBBF24',
    RESERVED: '#A78BFA',
    OFFLINE: '#F87171',
  };
  const compatible = myConnector && station.connectors.includes(myConnector);
  const handleDirections = (e: React.MouseEvent) => {
  e.stopPropagation();
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`,
    '_blank'
  );
};

  return (
    <button
      onClick={() => onSelect(station.id)}
      className={`w-full text-left rounded-xl p-3 mb-2 border transition-colors ${
        selected ? 'bg-raised border-accent' : 'bg-surface border-bd'
      }`}
      style={{ borderLeft: `3px solid ${statusHex[station.status]}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{station.name}</div>
          <div className="text-xs mt-0.5 text-dim">
            {station.distanceKm != null ? `${station.distanceKm} km away · ` : ''}
            {station.powerKw} kW
          </div>
        </div>
        <div className="font-data text-sm shrink-0 flex items-center">
          <IndianRupee size={12} />
          {station.pricePerKwh}/kWh
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {station.connectors.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
        {compatible && <Chip tone="good">Fits your vehicle</Chip>}
      </div>
      <div
  type="button"
  onClick={handleDirections}
  className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
>
  <Navigation size={14} />
  Get Directions
    </div>
      </button>
  );
}
