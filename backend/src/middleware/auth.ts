import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { ApiError } from './errorHandler';

/**
 * Verifies the Bearer token on the Authorization header and attaches the
 * decoded { id, role } to req.user. Every protected route sits behind this.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

/**
 * Role-gate factory. Usage: router.post('/x', requireAuth, requireRole('ADMIN'), handler)
 * Must run after requireAuth so req.user is populated.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}
