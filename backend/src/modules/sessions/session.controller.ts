import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';
import { emitSessionUpdate, emitStationUpdate } from '../../sockets';
import type { StartSessionInput, TickSessionInput } from './session.schema';

export async function startSession(req: Request<unknown, unknown, StartSessionInput>, res: Response) {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { station: true } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.riderId !== req.user!.id) throw new ApiError(403, 'This is not your booking');
  if (booking.status !== 'CONFIRMED') throw new ApiError(409, 'This booking is not ready to start');

  const [session] = await prisma.$transaction([
    prisma.chargingSession.create({
      data: { bookingId, riderId: req.user!.id, stationId: booking.stationId, status: 'ACTIVE' },
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } }),
    prisma.station.update({ where: { id: booking.stationId }, data: { status: 'CHARGING' } }),
  ]);

  emitStationUpdate(booking.stationId, { stationId: booking.stationId, status: 'CHARGING' });
  res.status(201).json({ session });
}

/**
 * Records an incremental energy delivery tick for an active session and
 * broadcasts the running total over the session's socket room. In production
 * this would be called by the charger's telemetry feed rather than a client;
 * it's exposed here so the frontend demo can simulate live charging.
 */
export async function tickSession(req: Request<{ id: string }, unknown, TickSessionInput>, res: Response) {
  const session = await prisma.chargingSession.findUnique({
    where: { id: req.params.id },
    include: { station: true },
  });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.riderId !== req.user!.id) throw new ApiError(403, 'This is not your session');
  if (session.status !== 'ACTIVE') throw new ApiError(409, 'Session is not active');

  const energyKwh = session.energyKwh + req.body.energyKwhDelta;
  const costTotal = Number((energyKwh * session.station.pricePerKwh).toFixed(2));

  const updated = await prisma.chargingSession.update({
    where: { id: session.id },
    data: { energyKwh, costTotal },
  });

  emitSessionUpdate(session.id, {
    sessionId: session.id,
    energyKwh: updated.energyKwh,
    costTotal: updated.costTotal,
  });
  res.json({ session: updated });
}

export async function stopSession(req: Request<{ id: string }>, res: Response) {
  const session = await prisma.chargingSession.findUnique({ where: { id: req.params.id } });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.riderId !== req.user!.id) throw new ApiError(403, 'This is not your session');
  if (session.status !== 'ACTIVE') throw new ApiError(409, 'Session is not active');

  const [updated] = await prisma.$transaction([
    prisma.chargingSession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED', endedAt: new Date() },
    }),
    prisma.station.update({ where: { id: session.stationId }, data: { status: 'AVAILABLE' } }),
  ]);

  emitStationUpdate(session.stationId, { stationId: session.stationId, status: 'AVAILABLE' });
  emitSessionUpdate(session.id, { sessionId: session.id, status: 'COMPLETED' });
  res.json({ session: updated });
}

export async function getActiveSession(req: Request, res: Response) {
  const session = await prisma.chargingSession.findFirst({
    where: { riderId: req.user!.id, status: 'ACTIVE' },
    include: { station: true },
  });
  res.json({ session });
}

export async function listMySessions(req: Request, res: Response) {
  const sessions = await prisma.chargingSession.findMany({
    where: { riderId: req.user!.id },
    include: { station: true },
    orderBy: { startedAt: 'desc' },
  });
  res.json({ sessions });
}
