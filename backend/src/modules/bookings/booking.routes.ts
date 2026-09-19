import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { cancelBooking, createBooking, listMyBookings } from './booking.controller';
import { createBookingSchema } from './booking.schema';

export const bookingRouter = Router();

bookingRouter.post('/', requireAuth, validateBody(createBookingSchema), asyncHandler(createBooking));
bookingRouter.get('/mine', requireAuth, asyncHandler(listMyBookings));
bookingRouter.post('/:id/cancel', requireAuth, asyncHandler(cancelBooking));
