import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('voltway_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  vehicleTypes: ('CAR' | 'BIKE')[];
  connectors: string[];
  compatibleBrands: string[];
  powerKw: number;
  pricePerKwh: number;
  status: 'AVAILABLE' | 'CHARGING' | 'RESERVED' | 'OFFLINE';
  operatorId: string | null;
  distanceKm?: number;
}

export interface Booking {
  id: string;
  stationId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  expiresAt: string;
  station: Station;
}

export interface ChargingSession {
  id: string;
  stationId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  energyKwh: number;
  costTotal: number;
  startedAt: string;
  station?: Station;
}
