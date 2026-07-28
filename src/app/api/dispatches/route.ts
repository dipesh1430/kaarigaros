import { prisma } from "@/lib/prisma";
import { dispatchSchema } from "@/lib/validations/dispatch.schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unbilled = searchParams.get("unbilled") === "true";

    const dispatches = await prisma.dispatch.findMany({
      where: unbilled
        ? {
            billingDispatches: { none: {} }, // not yet linked to any billing
          }
        : undefined,
      include: {
        batch: {
          select: {
            designName: true,
            color: true,
            ratePerPiece: true,
            merchantId: true,
            merchant: { select: { name: true } },
          },
        },
      },
      orderBy: { dispatchDate: "desc" },
    });

    return NextResponse.json(dispatches);
  } catch (error) {
    console.error("Failed to fetch dispatches:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispatches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = dispatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { batchId, chalanNumber, piecesDispatched, dispatchDate, notes } =
      parsed.data;

    // Create dispatch and update batch status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.create({
        data: {
          batchId,
          chalanNumber,
          piecesDispatched,
          dispatchDate: new Date(dispatchDate),
          notes: notes ?? null,
        },
      });

      // Advance batch status to 'dispatched' (only from 'ready' or 'press')
      await tx.batch.updateMany({
        where: {
          id: batchId,
          status: { in: ["ready", "press"] },
        },
        data: { status: "dispatched" },
      });

      return dispatch;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create dispatch:", error);
    return NextResponse.json(
      { error: "Failed to create dispatch" },
      { status: 500 }
    );
  }
}
