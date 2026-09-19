import { Router } from 'express';
import { login, me, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(login));
authRouter.get('/me', requireAuth, asyncHandler(me));
