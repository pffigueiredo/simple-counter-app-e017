
import { z } from 'zod';

// Counter schema
export const counterSchema = z.object({
  id: z.number(),
  count: z.number().int(),
  updated_at: z.coerce.date()
});

export type Counter = z.infer<typeof counterSchema>;

// Input schema for updating counter
export const updateCounterInputSchema = z.object({
  action: z.enum(['increment', 'decrement', 'reset'])
});

export type UpdateCounterInput = z.infer<typeof updateCounterInputSchema>;
