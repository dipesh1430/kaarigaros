import { prisma } from "@/lib/prisma";
import { cuttingLogSchema } from "@/lib/validations/batch.schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cuttingLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Create cutting log and conditionally advance batch status within a transaction
    const cuttingLog = await prisma.$transaction(async (tx) => {
      const created = await tx.cuttingLog.create({
        data: {
          batchId: parsed.data.batchId,
          piecesCut: parsed.data.piecesCut,
          fabricUsedMeters: parsed.data.fabricUsedMeters,
          cuttingDate: new Date(parsed.data.cuttingDate),
          notes: parsed.data.notes ?? null,
        },
      });

      // Advance status to 'cutting' only if currently 'received'
      await tx.batch.updateMany({
        where: { id: parsed.data.batchId, status: "received" },
        data: { status: "cutting" },
      });

      return created;
    });

    // Fetch the updated batch with cutting logs
    const updatedBatch = await prisma.batch.findUnique({
      where: { id: parsed.data.batchId },
      include: {
        cuttingLogs: { orderBy: { cuttingDate: "desc" } },
      },
    });

    return NextResponse.json(
      { cuttingLog, batch: updatedBatch },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create cutting log:", error);
    return NextResponse.json(
      { error: "Failed to create cutting log" },
      { status: 500 }
    );
  }
}
