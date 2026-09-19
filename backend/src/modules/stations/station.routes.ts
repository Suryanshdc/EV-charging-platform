import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createStation,
  getStation,
  importNearbyFromOpenChargeMap,
  listMyStations,
  listNearbyStations,
  updateStationStatus,
} from './station.controller';
import { createStationSchema, importNearbySchema, updateStationStatusSchema } from './station.schema';

export const stationRouter = Router();

// Public-ish: any logged-in rider can search nearby stations
stationRouter.get('/nearby', requireAuth, asyncHandler(listNearbyStations));
stationRouter.get('/mine', requireAuth, requireRole('OPERATOR', 'ADMIN'), asyncHandler(listMyStations));
stationRouter.get('/:id', requireAuth, asyncHandler(getStation));

stationRouter.post(
  '/',
  requireAuth,
  requireRole('OPERATOR', 'ADMIN'),
  validateBody(createStationSchema),
  asyncHandler(createStation)
);

stationRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('OPERATOR', 'ADMIN'),
  validateBody(updateStationStatusSchema),
  asyncHandler(updateStationStatus)
);

stationRouter.post(
  '/import/open-charge-map',
  requireAuth,
  requireRole('OPERATOR', 'ADMIN'),
  validateBody(importNearbySchema),
  asyncHandler(importNearbyFromOpenChargeMap)
);
