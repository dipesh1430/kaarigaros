import { z } from "zod";

export const batchSchema = z.object({
  merchantId: z.number(),
  designName: z
    .string()
    .min(1, "Design name is required")
    .max(100, "Design name must be under 100 characters"),
  color: z
    .string()
    .min(1, "Color is required")
    .max(50, "Color must be under 50 characters"),
  garmentType: z.enum(["kurti", "pant"]),
  fabricReceivedMeters: z.number().positive("Fabric must be > 0"),
  ratePerPiece: z.number().positive("Rate must be > 0"),
  totalPiecesPlanned: z.number().int().positive().optional().nullable(),
  dateReceived: z.string().min(1, "Date received is required"),
});

export type BatchFormValues = z.infer<typeof batchSchema>;

export const cuttingLogSchema = z.object({
  batchId: z.number(),
  piecesCut: z.number().int().positive("Pieces must be > 0"),
  fabricUsedMeters: z.number().positive("Fabric used must be > 0"),
  cuttingDate: z.string().min(1, "Date is required"),
  notes: z.string().optional().nullable(),
});

export type CuttingLogFormValues = z.infer<typeof cuttingLogSchema>;
