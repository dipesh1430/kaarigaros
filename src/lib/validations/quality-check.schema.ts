import { z } from "zod";

export const qualityCheckSchema = z.object({
  batchId: z.number().int(),
  checkedBy: z.enum(["home", "press_vendor"]),
  piecesChecked: z.number().int().positive("Pieces checked must be > 0"),
  piecesRejected: z.number().int().min(0, "Rejected pieces can't be negative"),
  rejectionReason: z.string().max(200).optional().nullable(),
  checkDate: z.string().nonempty("Date is required"),
});

export type QualityCheckFormValues = z.infer<typeof qualityCheckSchema>;
