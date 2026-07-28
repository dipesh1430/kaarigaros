import { prisma } from "@/lib/prisma";
import { qualityCheckSchema } from "@/lib/validations/quality-check.schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = qualityCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { batchId, checkedBy, piecesChecked, piecesRejected, rejectionReason, checkDate } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const qualityCheck = await tx.qualityCheck.create({
        data: {
          batchId,
          checkedBy,
          piecesChecked,
          piecesRejected,
          rejectionReason: rejectionReason ?? null,
          checkDate: new Date(checkDate),
        },
      });

      // Auto-advance batch status based on checkpoint
      if (checkedBy === "home") {
        // Home check done → advance from interlock/stitching to press
        await tx.batch.updateMany({
          where: {
            id: batchId,
            status: { in: ["stitching", "interlock"] },
          },
          data: { status: "press" },
        });
      } else if (checkedBy === "press_vendor") {
        // Press vendor check done → advance from press to ready
        await tx.batch.updateMany({
          where: { id: batchId, status: "press" },
          data: { status: "ready" },
        });
      }

      return qualityCheck;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create quality check:", error);
    return NextResponse.json(
      { error: "Failed to create quality check" },
      { status: 500 }
    );
  }
}
