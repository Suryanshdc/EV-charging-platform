import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';
import { emitStationUpdate } from '../../sockets';
import type { CreateBookingInput } from './booking.schema';

const BOOKING_HOLD_MINUTES = 15;

export async function createBooking(req: Request<unknown, unknown, CreateBookingInput>, res: Response) {
  const { stationId } = req.body;

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) throw new ApiError(404, 'Station not found');
  if (station.status !== 'AVAILABLE') {
    throw new ApiError(409, 'This station is not available to book right now');
  }

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        riderId: req.user!.id,
        stationId,
        status: 'CONFIRMED',
        expiresAt: new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000),
      },
    }),
    prisma.station.update({ where: { id: stationId }, data: { status: 'RESERVED' } }),
  ]);

  emitStationUpdate(stationId, { stationId, status: 'RESERVED' });
  res.status(201).json({ booking });
}

export async function listMyBookings(req: Request, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { riderId: req.user!.id },
    include: { station: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ bookings });
}

export async function cancelBooking(req: Request<{ id: string }>, res: Response) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.riderId !== req.user!.id) throw new ApiError(403, 'This is not your booking');
  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
    throw new ApiError(409, 'This booking can no longer be cancelled');
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }),
    prisma.station.update({ where: { id: booking.stationId }, data: { status: 'AVAILABLE' } }),
  ]);

  emitStationUpdate(booking.stationId, { stationId: booking.stationId, status: 'AVAILABLE' });
  res.json({ message: 'Booking cancelled' });
}
