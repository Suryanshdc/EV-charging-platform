import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';

export const vehicleRouter = Router();

const addVehicleSchema = z.object({
  type: z.enum(['CAR', 'BIKE']),
  brand: z.string().min(1),
  model: z.string().min(1),
  connector: z.enum(['CCS2', 'CHADEMO', 'TYPE2', 'BHARAT_AC001', 'BHARAT_DC001']),
});

vehicleRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const vehicles = await prisma.vehicle.findMany({ where: { ownerId: req.user!.id } });
    res.json({ vehicles });
  })
);

vehicleRouter.post(
  '/',
  requireAuth,
  validateBody(addVehicleSchema),
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.create({ data: { ...req.body, ownerId: req.user!.id } });
    res.status(201).json({ vehicle });
  })
);

vehicleRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.vehicle.deleteMany({ where: { id: req.params.id, ownerId: req.user!.id } });
    res.status(204).send();
  })
);
