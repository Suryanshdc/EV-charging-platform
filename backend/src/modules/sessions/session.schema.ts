import { z } from 'zod';

export const startSessionSchema = z.object({
  bookingId: z.string().min(1),
});

export const tickSessionSchema = z.object({
  energyKwhDelta: z.number().positive().max(50),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type TickSessionInput = z.infer<typeof tickSessionSchema>;
