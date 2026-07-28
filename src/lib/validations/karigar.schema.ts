import { z } from "zod";

const genderEnum = z.enum(["", "Male", "Female"]);

export const karigarSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  type: z.enum(["stitching", "button"]),
  gender: genderEnum,
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be under 15 characters")
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number"),
  selfPickup: z.boolean(),
});

export type KarigarFormValues = z.infer<typeof karigarSchema>;
