'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, Gauge, IndianRupee, TrendingUp } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { Navbar } from '@/components/Navbar';
import { StatusDot, statusLabel } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, type Station } from '@/lib/api';

function StatBlock({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-4 flex items-start gap-3 bg-surface border border-bd">
      <div className="rounded-lg p-2 bg-accent/10 text-accent shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <div className="font-data text-xl leading-none">{value}</div>
        <div className="text-xs mt-1 text-dim">{label}</div>
      </div>
    </div>
  );
}

function OperatorDashboard() {
  const queryClient = useQueryClient();
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');

  const stationsQuery = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: async () => (await api.get<{ stations: Station[] }>('/api/stations/mine')).data.stations,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Station['status'] }) =>
      api.patch(`/api/stations/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stations', 'mine'] }),
  });

  const importMutation = useMutation({
    mutationFn: async () =>
      api.post('/api/stations/import/open-charge-map', { latitude: Number(lat), longitude: Number(lng), radiusKm: 10 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stations', 'mine'] }),
  });

  const stations = stationsQuery.data ?? [];
  const online = stations.filter((s) => s.status !== 'OFFLINE').length;

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <Navbar />
      <div className="px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatBlock icon={Zap} label="Stations online" value={`${online}/${stations.length}`} />
          <StatBlock icon={Gauge} label="Avg utilization" value="68%" />
          <StatBlock icon={IndianRupee} label="Revenue today" value="4,860" />
          <StatBlock icon={TrendingUp} label="Sessions today" value="27" />
        </div>

        <div className="rounded-xl p-4 mb-5 bg-surface border border-bd">
          <div className="text-sm font-medium mb-1">Import real car stations near a location</div>
          <p className="text-xs text-dim mb-3">
            Pulls live station data from Open Charge Map for the coordinates below and adds them to your account.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input value={lat} onChange={(e) => setLat(e.target.value)} className="rounded-lg px-3 py-2 bg-raised border border-bd text-sm w-32" placeholder="Latitude" />
            <input value={lng} onChange={(e) => setLng(e.target.value)} className="rounded-lg px-3 py-2 bg-raised border border-bd text-sm w-32" placeholder="Longitude" />
            <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
              {importMutation.isPending ? 'Importing…' : 'Import nearby stations'}
            </Button>
            {importMutation.isSuccess && <span className="text-xs text-avail">Imported successfully.</span>}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden bg-surface border border-bd">
          <div className="grid grid-cols-5 text-xs px-4 py-2 border-b border-bd text-dim">
            <span>Station</span>
            <span>Type</span>
            <span>Status</span>
            <span>Power</span>
            <span>Change status</span>
          </div>
          {stationsQuery.isLoading && <div className="px-4 py-3 text-sm text-dim">Loading your stations…</div>}
          {stations.map((s) => (
            <div key={s.id} className="grid grid-cols-5 items-center text-sm px-4 py-3 border-b border-bd">
              <span>{s.name}</span>
              <span className="text-dim">{s.vehicleTypes.join(', ')}</span>
              <span className="inline-flex items-center gap-1.5">
                <StatusDot status={s.status} />
                {statusLabel(s.status)}
              </span>
              <span className="font-data text-dim">{s.powerKw} kW</span>
              <select
                value={s.status}
                onChange={(e) => statusMutation.mutate({ id: s.id, status: e.target.value as Station['status'] })}
                className="rounded-lg px-2 py-1.5 bg-raised border border-bd text-xs"
              >
                {(['AVAILABLE', 'CHARGING', 'RESERVED', 'OFFLINE'] as const).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {!stationsQuery.isLoading && stations.length === 0 && (
            <div className="px-4 py-3 text-sm text-dim">
              No stations yet. Import real ones above, or add stations directly via the API.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperatorPage() {
  return (
    <RequireAuth role="OPERATOR">
      <OperatorDashboard />
    </RequireAuth>
  );
}
