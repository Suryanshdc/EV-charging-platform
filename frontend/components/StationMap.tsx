'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import type { Station } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

const statusColor: Record<Station['status'], string> = {
  AVAILABLE: '#34D399',
  CHARGING: '#FBBF24',
  RESERVED: '#A78BFA',
  OFFLINE: '#F87171',
};

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function StationMap({
  center,
  stations,
  selectedId,
  onSelect,
}: {
  center: { lat: number; lng: number };
  stations: Station[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-bd" style={{ height: 420 }}>
      <MapContainer
         center={[center.lat, center.lng]}
         zoom={13}
         style={{ height: '100%', width: '100%' }}
>
        <RecenterOnChange lat={center.lat} lng={center.lng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[center.lat, center.lng]} radius={7} pathOptions={{ color: '#4E6EF2', fillColor: '#4E6EF2', fillOpacity: 0.9 }}>
          <Tooltip>You are here</Tooltip>
        </CircleMarker>
        {stations.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={s.id === selectedId ? 12 : 9}
            pathOptions={{ color: statusColor[s.status], fillColor: statusColor[s.status], fillOpacity: 0.75, weight: 2 }}
            eventHandlers={{ click: () => onSelect(s.id) }}
          >
            <Tooltip>{s.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
