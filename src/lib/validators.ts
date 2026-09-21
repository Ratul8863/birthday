import { z } from "zod";

export const spinRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export type SpinRequest = z.infer<typeof spinRequestSchema>;
