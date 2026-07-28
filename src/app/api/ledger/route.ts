import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const withdrawalSchema = z.object({
  karigarId: z.number().int(),
  amount: z.number().positive("Amount must be > 0"),
  entryDate: z.string().nonempty("Date is required"),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = withdrawalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { karigarId, amount, entryDate, notes } = parsed.data;

    // Verify karigar exists
    const karigar = await prisma.karigar.findUnique({
      where: { id: karigarId },
      select: { id: true, name: true },
    });

    if (!karigar) {
      return NextResponse.json(
        { error: "Karigar not found" },
        { status: 404 }
      );
    }

    // Create withdrawal entry (+ve = karigar owes company)
    const entry = await prisma.karigarLedger.create({
      data: {
        karigarId,
        entryDate: new Date(entryDate),
        entryType: "withdrawal",
        amount, // positive = karigar owes company
        notes: notes ?? null,
      },
    });

    return NextResponse.json(
      {
        ...entry,
        karigarName: karigar.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal" },
      { status: 500 }
    );
  }
}
