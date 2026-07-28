import { prisma } from "@/lib/prisma";
import { assignmentSchema } from "@/lib/validations/assignment.schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = assignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { batchId, karigarId, piecesAssigned, dateGiven } = parsed.data;

    // Create assignment and advance batch status if needed — in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.karigarAssignment.create({
        data: {
          batchId,
          karigarId,
          piecesAssigned,
          dateGiven: new Date(dateGiven),
        },
        include: {
          karigar: { select: { id: true, name: true, type: true } },
        },
      });

      // Advance batch status from cutting → stitching (or received → stitching)
      await tx.batch.updateMany({
        where: { id: batchId, status: { in: ["received", "cutting"] } },
        data: { status: "stitching" },
      });

      return assignment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
