'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Battery, X, CheckCircle2 } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { Navbar } from '@/components/Navbar';
import { StationCard } from '@/components/StationCard';
import { Chip, StatusDot, statusLabel } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, type Station, type ChargingSession, type Booking } from '@/lib/api';
import { getSocket } from '@/lib/socket';

const StationMap = dynamic(() => import('@/components/StationMap').then((m) => m.StationMap), { ssr: false });

// Default to New Delhi if the browser denies/lacks geolocation.
const DEFAULT_COORDS = { lat: 28.6139, lng: 77.209 };

const CONNECTOR_OPTIONS = ['CCS2', 'CHADEMO', 'TYPE2', 'BHARAT_AC001', 'BHARAT_DC001'];

function RiderDashboard() {
  const queryClient = useQueryClient();
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [vehicleType, setVehicleType] = useState<'ALL' | 'CAR' | 'BIKE'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently keep the default center if permission is denied
    );
  }, []);

  const stationsQuery = useQuery({
    queryKey: ['stations', 'nearby', coords.lat, coords.lng, vehicleType],
    queryFn: async () => {
      const res = await api.get<{ stations: Station[] }>('/api/stations/nearby', {
        params: { lat: coords.lat, lng: coords.lng, radiusKm: 25, vehicleType },
      });
      return res.data.stations;
    },
  });

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: async () => (await api.get('/api/vehicles/mine')).data.vehicles as { id: string; connector: string; brand: string; model: string }[],
  });

  const activeSessionQuery = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: async () => (await api.get<{ session: ChargingSession | null }>('/api/sessions/active')).data.session,
    refetchInterval: 5000,
  });

  const [myBooking, setMyBooking] = useState<Booking | null>(null);

  // Live station updates over Socket.io — no polling needed for status changes.
  useEffect(() => {
    const socket = getSocket();
    const onUpdate = () => queryClient.invalidateQueries({ queryKey: ['stations', 'nearby'] });
    socket.on('station:list-update', onUpdate);
    return () => {
      socket.off('station:list-update', onUpdate);
    };
  }, [queryClient]);

  // Simulate charger telemetry for the demo: every few seconds, report a
  // small energy delta for the active session. A real deployment would
  // remove this and let the charger hardware call the tick endpoint instead.
  useEffect(() => {
    const session = activeSessionQuery.data;
    if (!session) return;
    const id = setInterval(() => {
      api.post(`/api/sessions/${session.id}/tick`, { energyKwhDelta: 0.2 }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
      });
    }, 3000);
    return () => clearInterval(id);
  }, [activeSessionQuery.data?.id, queryClient]);

  const bookMutation = useMutation({
    mutationFn: async (stationId: string) => (await api.post<{ booking: Booking }>('/api/bookings', { stationId })).data.booking,
    onSuccess: (booking) => {
      setMyBooking(booking);
      queryClient.invalidateQueries({ queryKey: ['stations', 'nearby'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => api.post(`/api/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      setMyBooking(null);
      queryClient.invalidateQueries({ queryKey: ['stations', 'nearby'] });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (bookingId: string) => api.post('/api/sessions/start', { bookingId }),
    onSuccess: () => {
      setMyBooking(null);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['stations', 'nearby'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => api.post(`/api/sessions/${sessionId}/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations', 'nearby'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
    },
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (input: { type: 'CAR' | 'BIKE'; brand: string; model: string; connector: string }) =>
      api.post('/api/vehicles', input),
    onSuccess: () => {
      setShowAddVehicle(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'mine'] });
    },
  });

  const stations = stationsQuery.data ?? [];
  const myVehicle = vehiclesQuery.data?.[0];
  const selectedStation = useMemo(() => stations.find((s) => s.id === selectedId) ?? null, [stations, selectedId]);
  const session = activeSessionQuery.data;

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <Navbar />

      <div className="px-5">
        {session && (
          <div
            className="rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4 border border-charge/30"
            style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.12), rgba(251,191,36,0.03))' }}
          >
            <div className="flex items-center gap-2 text-charge">
              <Battery size={18} />
              <span className="font-data text-lg text-txt">{session.energyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="text-xs text-dim">{session.station?.name}</div>
            <div className="font-data text-sm">₹{session.costTotal.toFixed(2)}</div>
            <Button variant="secondary" className="ml-auto" onClick={() => stopSessionMutation.mutate(session.id)}>
              End session
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex p-1 rounded-xl bg-raised border border-bd">
            {(['ALL', 'CAR', 'BIKE'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVehicleType(v)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  vehicleType === v ? 'bg-accent text-white' : 'text-dim'
                }`}
              >
                {v === 'ALL' ? 'All' : v === 'CAR' ? 'Car' : 'Bike'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {myVehicle ? (
              <Chip tone="accent">
                {myVehicle.brand} {myVehicle.model} · {myVehicle.connector}
              </Chip>
            ) : (
              <button onClick={() => setShowAddVehicle(true)} className="text-xs text-accent underline">
                Add your vehicle for compatibility checks
              </button>
            )}
          </div>
        </div>

        {showAddVehicle && (
          <AddVehicleForm
            onCancel={() => setShowAddVehicle(false)}
            onSubmit={(v) => addVehicleMutation.mutate(v)}
            submitting={addVehicleMutation.isPending}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <StationMap center={coords} stations={stations} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="lg:col-span-2 overflow-y-auto pr-1" style={{ maxHeight: 420 }}>
            {stationsQuery.isLoading && <div className="text-sm text-dim">Finding stations near you…</div>}
            {stations.map((s) => (
              <StationCard key={s.id} station={s} selected={s.id === selectedId} onSelect={setSelectedId} myConnector={myVehicle?.connector} />
            ))}
            {!stationsQuery.isLoading && stations.length === 0 && (
              <div className="text-sm text-dim">
                No stations found nearby yet. If you&rsquo;re an operator, import real stations from the operator
                dashboard first.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedStation && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSelectedId(null)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 z-50 p-5 overflow-y-auto bg-surface border-l border-bd">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-display text-lg">{selectedStation.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <StatusDot status={selectedStation.status} pulse={selectedStation.status === 'CHARGING'} />
                  <span className="text-xs text-dim">{statusLabel(selectedStation.status)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded-lg text-dim">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg p-3 bg-raised">
                <div className="text-xs text-dim">Power output</div>
                <div className="font-data text-sm mt-1">{selectedStation.powerKw} kW</div>
              </div>
              <div className="rounded-lg p-3 bg-raised">
                <div className="text-xs text-dim">Price</div>
                <div className="font-data text-sm mt-1">₹{selectedStation.pricePerKwh} / kWh</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs mb-1.5 text-dim">Connector types</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStation.connectors.map((c) => (
                  <Chip key={c} tone="accent">
                    {c}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs mb-1.5 text-dim">Compatible brands</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStation.compatibleBrands.length > 0 ? (
                  selectedStation.compatibleBrands.map((b) => <Chip key={b}>{b}</Chip>)
                ) : (
                  <span className="text-xs text-faint">Any vehicle matching the connector above</span>
                )}
              </div>
            </div>

            {session?.stationId === selectedStation.id ? (
              <div className="text-sm rounded-lg p-3 bg-charge/10 text-charge border border-charge/30">
                Your session is running here — track it from the bar at the top.
              </div>
            ) : myBooking?.stationId === selectedStation.id ? (
              <div className="space-y-2">
                <div className="text-sm rounded-lg p-3 bg-reserve/10 text-reserve border border-reserve/30 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Booked for you. Start once you plug in.
                </div>
                <Button className="w-full" onClick={() => startSessionMutation.mutate(myBooking.id)} disabled={startSessionMutation.isPending}>
                  Start charging now
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => cancelMutation.mutate(myBooking.id)}>
                  Cancel booking
                </Button>
              </div>
            ) : selectedStation.status === 'AVAILABLE' ? (
              <Button className="w-full" onClick={() => bookMutation.mutate(selectedStation.id)} disabled={bookMutation.isPending}>
                Book this charger
              </Button>
            ) : (
              <div className="text-sm rounded-lg p-3 bg-white/5 text-dim border border-bd">
                This charger isn&rsquo;t bookable right now — {statusLabel(selectedStation.status).toLowerCase()}.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AddVehicleForm({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: (v: { type: 'CAR' | 'BIKE'; brand: string; model: string; connector: string }) => void;
  submitting: boolean;
}) {
  const [type, setType] = useState<'CAR' | 'BIKE'>('CAR');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [connector, setConnector] = useState(CONNECTOR_OPTIONS[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ type, brand, model, connector });
      }}
      className="rounded-xl p-4 mb-4 bg-surface border border-bd grid sm:grid-cols-5 gap-2 items-end"
    >
      <select value={type} onChange={(e) => setType(e.target.value as 'CAR' | 'BIKE')} className="rounded-lg px-2 py-2 bg-raised border border-bd text-sm">
        <option value="CAR">Car</option>
        <option value="BIKE">Bike</option>
      </select>
      <input placeholder="Brand" required value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-lg px-2 py-2 bg-raised border border-bd text-sm" />
      <input placeholder="Model" required value={model} onChange={(e) => setModel(e.target.value)} className="rounded-lg px-2 py-2 bg-raised border border-bd text-sm" />
      <select value={connector} onChange={(e) => setConnector(e.target.value)} className="rounded-lg px-2 py-2 bg-raised border border-bd text-sm">
        {CONNECTOR_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function RiderPage() {
  return (
    <RequireAuth role="RIDER">
      <RiderDashboard />
    </RequireAuth>
  );
}
