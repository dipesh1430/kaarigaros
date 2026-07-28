import { prisma } from "@/lib/prisma";
import { markReturnedSchema } from "@/lib/validations/assignment.schema";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const assignmentId = parseInt(id, 10);

    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
    }

    const existing = await prisma.karigarAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existing.status !== "in_progress") {
      return NextResponse.json(
        { error: "Assignment is already completed or paid" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = markReturnedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Mark returned + check if all assignments are completed → advance batch status
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.karigarAssignment.update({
        where: { id: assignmentId },
        data: {
          piecesReturned: parsed.data.piecesReturned,
          dateCollected: new Date(parsed.data.dateCollected),
          status: "completed",
        },
        include: {
          karigar: { select: { id: true, name: true } },
        },
      });

      // Check if ALL assignments for this batch are now completed
      const remainingInProgress = await tx.karigarAssignment.count({
        where: {
          batchId: existing.batchId,
          status: "in_progress",
        },
      });

      // If no more in-progress assignments, advance batch status
      if (remainingInProgress === 0) {
        const batch = await tx.batch.findUnique({
          where: { id: existing.batchId },
          select: { status: true },
        });

        // Only advance if currently in 'stitching' — don't skip ahead of QC/dispatch
        if (batch?.status === "stitching") {
          await tx.batch.update({
            where: { id: existing.batchId },
            data: { status: "interlock" },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to mark assignment returned:", error);
    return NextResponse.json(
      { error: "Failed to mark assignment returned" },
      { status: 500 }
    );
  }
}
