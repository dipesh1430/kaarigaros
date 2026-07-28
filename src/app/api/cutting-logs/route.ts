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

    // Create cutting log and update batch status atomically
    const [cuttingLog] = await prisma.$transaction([
      prisma.cuttingLog.create({
        data: {
          batchId: parsed.data.batchId,
          piecesCut: parsed.data.piecesCut,
          fabricUsedMeters: parsed.data.fabricUsedMeters,
          cuttingDate: new Date(parsed.data.cuttingDate),
          notes: parsed.data.notes ?? null,
        },
      }),
      prisma.batch.update({
        where: { id: parsed.data.batchId },
        data: {
          // Only advance status if it's still 'received'
          status:
            prisma.batch.findUnique({ where: { id: parsed.data.batchId } })
              .then((b) => (b?.status === "received" ? "cutting" : undefined))
              .catch(() => undefined) as any,
        },
      }),
    ]);

    // Second query to apply status update if needed
    const batch = await prisma.batch.findUnique({
      where: { id: parsed.data.batchId },
    });

    if (batch && batch.status === "received") {
      await prisma.batch.update({
        where: { id: parsed.data.batchId },
        data: { status: "cutting" },
      });
    }

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
