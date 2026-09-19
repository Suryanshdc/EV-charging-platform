import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { getActiveSession, listMySessions, startSession, stopSession, tickSession } from './session.controller';
import { startSessionSchema, tickSessionSchema } from './session.schema';

export const sessionRouter = Router();

sessionRouter.post('/start', requireAuth, validateBody(startSessionSchema), asyncHandler(startSession));
sessionRouter.post('/:id/tick', requireAuth, validateBody(tickSessionSchema), asyncHandler(tickSession));
sessionRouter.post('/:id/stop', requireAuth, asyncHandler(stopSession));
sessionRouter.get('/active', requireAuth, asyncHandler(getActiveSession));
sessionRouter.get('/mine', requireAuth, asyncHandler(listMySessions));
