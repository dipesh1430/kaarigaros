import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const karigarId = parseInt(searchParams.get("karigarId") ?? "", 10);

    if (karigarId) {
      // Get rates for a specific karigar
      const rates = await prisma.karigarRate.findMany({
        where: { karigarId, active: true },
        orderBy: [{ designName: "asc" }, { color: "asc" }],
      });
      return NextResponse.json(rates);
    }

    // Get all rates (for admin)
    const rates = await prisma.karigarRate.findMany({
      include: { karigar: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rates);
  } catch (error) {
    console.error("Failed to fetch karigar rates:", error);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { karigarId, designName, color, garmentType, ratePerPiece, notes } = body;

    if (!karigarId || !designName || !ratePerPiece) {
      return NextResponse.json(
        { error: "karigarId, designName, and ratePerPiece are required" },
        { status: 400 }
      );
    }

    const rate = await prisma.karigarRate.upsert({
      where: {
        karigarId_designName_color: {
          karigarId,
          designName,
          color: color ?? "",
        },
      },
      update: { ratePerPiece, garmentType, notes, active: true },
      create: {
        karigarId,
        designName,
        color: color ?? null,
        garmentType: garmentType ?? null,
        ratePerPiece,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    console.error("Failed to save karigar rate:", error);
    return NextResponse.json({ error: "Failed to save rate" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") ?? "", 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid rate ID" }, { status: 400 });
    }

    await prisma.karigarRate.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete rate:", error);
    return NextResponse.json({ error: "Failed to delete rate" }, { status: 500 });
  }
}
