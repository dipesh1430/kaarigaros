import { z } from "zod";

// Validate ISO date (date-only or datetime) and reject semantically invalid values
const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
function isValidISODate(s: string) {
  if (typeof s !== "string") return false;
  if (!isoDateRegex.test(s)) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return false;
  const [y, m, day] = s.split("T")[0].split("-").map(Number);
  return (
    d.getUTCFullYear() === y &&
    d.getUTCMonth() + 1 === m &&
    d.getUTCDate() === day
  );
}

export const batchSchema = z.object({
  merchantId: z.number().int(),
  designName: z
    .string()
    .min(1, "Design name is required")
    .max(100, "Design name must be under 100 characters"),
  color: z
    .string()
    .min(1, "Color is required")
    .max(50, "Color must be under 50 characters"),
  colors: z.array(z.string().min(1).max(50)).optional(),
  garmentType: z.enum(["kurti", "pant"]),
  fabricReceivedMeters: z.number().positive("Fabric must be > 0"),
  ratePerPiece: z.number().positive("Rate must be > 0"),
  totalPiecesPlanned: z.number().int().positive().optional().nullable(),
  dateReceived: z
    .string()
    .nonempty("Date received is required")
    .refine(isValidISODate, { message: "Invalid ISO date" }),
});

export type BatchFormValues = z.infer<typeof batchSchema>;

export const cuttingLogSchema = z.object({
  batchId: z.number().int(),
  piecesCut: z.number().int().positive("Pieces must be > 0"),
  fabricUsedMeters: z.number().positive("Fabric used must be > 0"),
  cuttingDate: z
    .string()
    .nonempty("Date is required")
    .refine(isValidISODate, { message: "Invalid ISO date" }),
  notes: z.string().optional().nullable(),
});

export type CuttingLogFormValues = z.infer<typeof cuttingLogSchema>;
