import { z } from "zod";

export const assignmentSchema = z.object({
  batchId: z.number().int(),
  karigarId: z.number().int(),
  piecesAssigned: z.number().int().positive("Pieces must be > 0"),
  dateGiven: z
    .string()
    .nonempty("Date is required"),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export const markReturnedSchema = z.object({
  piecesReturned: z.number().int().positive("Pieces returned must be > 0"),
  dateCollected: z
    .string()
    .nonempty("Date is required"),
});

export type MarkReturnedValues = z.infer<typeof markReturnedSchema>;
