import type { Request, Response } from 'express';
import type { ConnectorType, VehicleType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';
import { emitStationUpdate } from '../../sockets';
import { fetchNearbyStations } from '../../services/openChargeMap';
import type { CreateStationInput, ImportNearbyInput, UpdateStationStatusInput } from './station.schema';

// Haversine distance in km. Good enough at this data scale; a PostGIS
// nearest-neighbor query would replace this if the station count grows large.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listNearbyStations(req: Request, res: Response) {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : 15;
  const vehicleType = typeof req.query.vehicleType === 'string' ? req.query.vehicleType.toUpperCase() : undefined;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ApiError(400, 'lat and lng query params are required numbers');
  }

  const stations = await prisma.station.findMany({
    where:
      vehicleType && vehicleType !== 'ALL'
        ? { vehicleTypes: { has: vehicleType as VehicleType } }
        : undefined,
  });

  const withDistance = stations
    .map((s) => ({ ...s, distanceKm: Number(distanceKm(lat, lng, s.latitude, s.longitude).toFixed(2)) }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ stations: withDistance });
}

export async function getStation(req: Request, res: Response) {
  const station = await prisma.station.findUnique({ where: { id: req.params.id } });
  if (!station) throw new ApiError(404, 'Station not found');
  res.json({ station });
}

export async function createStation(req: Request<unknown, unknown, CreateStationInput>, res: Response) {
  const station = await prisma.station.create({
    data: { ...req.body, operatorId: req.user!.id },
  });
  res.status(201).json({ station });
}

export async function listMyStations(req: Request, res: Response) {
  const stations = await prisma.station.findMany({ where: { operatorId: req.user!.id } });
  res.json({ stations });
}

export async function updateStationStatus(
  req: Request<{ id: string }, unknown, UpdateStationStatusInput>,
  res: Response
) {
  const existing = await prisma.station.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Station not found');
  if (req.user!.role !== 'ADMIN' && existing.operatorId !== req.user!.id) {
    throw new ApiError(403, 'You can only update your own stations');
  }

  const station = await prisma.station.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });

  emitStationUpdate(station.id, { stationId: station.id, status: station.status });
  res.json({ station });
}

/**
 * Pulls real charging stations from Open Charge Map near a coordinate and
 * upserts them into our database (car stations only — two-wheeler stations
 * are seeded separately, see prisma/seed.ts).
 */
export async function importNearbyFromOpenChargeMap(
  req: Request<unknown, unknown, ImportNearbyInput>,
  res: Response
) {
  const { latitude, longitude, radiusKm } = req.body;
  const results = await fetchNearbyStations(latitude, longitude, radiusKm);

  const upserted = await Promise.all(
    results.map((r) =>
      prisma.station.upsert({
        where: { externalId: r.externalId },
        update: {
           operatorId: req.user!.id,
           name: r.name,
           address: r.address,
           latitude: r.latitude,
           longitude: r.longitude,
           powerKw: r.powerKw,
           connectors: r.connectors as ConnectorType[],
},
        create: {
          externalId: r.externalId,
          operatorId: req.user!.id,
          name: r.name,
          name: r.name,
          address: r.address || 'Address unavailable',
          latitude: r.latitude,
          longitude: r.longitude,
          vehicleTypes: ['CAR'],
          connectors: r.connectors as ConnectorType[],
          compatibleBrands: [],
          powerKw: r.powerKw,
          pricePerKwh: 18,
          status: 'AVAILABLE',
        },
      })
    )
  );

  res.status(201).json({ imported: upserted.length, stations: upserted });
}
