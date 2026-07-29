import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Reject any id that contains non-digit characters (e.g. "1junk")
    if (!/^[0-9]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 });
    }

    const batchId = parseInt(id, 10);

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        merchant: { select: { name: true, id: true } },
        colors: { select: { id: true, color: true } },
        cuttingLogs: { orderBy: { cuttingDate: "desc" } },
        assignments: {
          include: {
            karigar: { select: { id: true, name: true, type: true } },
          },
          orderBy: { dateGiven: "desc" },
        },
        qualityChecks: { orderBy: { checkDate: "desc" } },
        dispatches: { orderBy: { dispatchDate: "desc" } },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Failed to fetch batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch" },
      { status: 500 }
    );
  }
}
