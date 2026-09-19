import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { stationRouter } from './modules/stations/station.routes';
import { bookingRouter } from './modules/bookings/booking.routes';
import { sessionRouter } from './modules/sessions/session.routes';
import { vehicleRouter } from './modules/vehicles/vehicle.routes';
import { userRouter } from './modules/users/user.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRouter);
  app.use('/api/stations', stationRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/vehicles', vehicleRouter);
  app.use('/api/users', userRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
