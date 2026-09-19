import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth';

export const userRouter = Router();

userRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  })
);

userRouter.get(
  '/stats/overview',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const [totalUsers, totalStations, activeSessions, ridersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.station.count(),
      prisma.chargingSession.count({ where: { status: 'ACTIVE' } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    res.json({
      totalUsers,
      totalStations,
      activeSessions,
      usersByRole: Object.fromEntries(ridersByRole.map((r) => [r.role, r._count])),
    });
  })
);
