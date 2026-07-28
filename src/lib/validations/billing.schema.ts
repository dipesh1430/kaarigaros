import { z } from "zod";

export const createBillingSchema = z.object({
  merchantId: z.number().int(),
  billingDate: z.string().nonempty("Date is required"),
  dispatchIds: z.array(z.number().int()).min(1, "Select at least one dispatch"),
  paymentMode: z.enum(["cash", "cheque"]),
  paymentStatus: z.enum(["pending", "received"]).default("pending"),
});

export type CreateBillingValues = z.infer<typeof createBillingSchema>;
