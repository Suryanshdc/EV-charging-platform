import { z } from 'zod';

export const createStationSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  vehicleTypes: z.array(z.enum(['CAR', 'BIKE'])).min(1),
  connectors: z.array(z.enum(['CCS2', 'CHADEMO', 'TYPE2', 'BHARAT_AC001', 'BHARAT_DC001'])).min(1),
  compatibleBrands: z.array(z.string()).default([]),
  powerKw: z.number().positive(),
  pricePerKwh: z.number().positive(),
});

export const updateStationStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'CHARGING', 'RESERVED', 'OFFLINE']),
});

export const importNearbySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().positive().max(50).default(10),
});

export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationStatusInput = z.infer<typeof updateStationStatusSchema>;
export type ImportNearbyInput = z.infer<typeof importNearbySchema>;
