import { z } from "zod";

export const dispatchSchema = z.object({
  batchId: z.number().int(),
  chalanNumber: z
    .string()
    .min(1, "Chalan number is required")
    .max(50, "Chalan number must be under 50 characters"),
  piecesDispatched: z.number().int().positive("Pieces must be > 0"),
  dispatchDate: z.string().nonempty("Date is required"),
  notes: z.string().optional().nullable(),
});

export type DispatchFormValues = z.infer<typeof dispatchSchema>;
