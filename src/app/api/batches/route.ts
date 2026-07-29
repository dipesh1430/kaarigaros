import { prisma } from "@/lib/prisma";
import { batchSchema } from "@/lib/validations/batch.schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        merchant: { select: { name: true } },
        cuttingLogs: { select: { fabricUsedMeters: true } },
        colors: { select: { id: true, color: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.create({
      data: {
        merchantId: parsed.data.merchantId,
        designName: parsed.data.designName,
        color: parsed.data.color,
        garmentType: parsed.data.garmentType,
        fabricReceivedMeters: parsed.data.fabricReceivedMeters,
        ratePerPiece: parsed.data.ratePerPiece,
        totalPiecesPlanned: parsed.data.totalPiecesPlanned ?? null,
        dateReceived: new Date(parsed.data.dateReceived),
        colors: parsed.data.colors?.length
          ? { create: parsed.data.colors.filter(c => c !== parsed.data.color).map(c => ({ color: c })) }
          : undefined,
      },
      include: {
        merchant: { select: { name: true } },
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Failed to create batch:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}
