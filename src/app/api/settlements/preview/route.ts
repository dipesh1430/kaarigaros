import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlementPreview } from "@/lib/calculations/settlement-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const karigarId = parseInt(searchParams.get("karigarId") ?? "", 10);

    if (isNaN(karigarId)) {
      return NextResponse.json(
        { error: "Invalid karigarId" },
        { status: 400 }
      );
    }

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

    const preview = await calculateSettlementPreview(karigarId);
    preview.karigarName = karigar.name;

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Failed to calculate settlement preview:", error);
    return NextResponse.json(
      { error: "Failed to calculate settlement preview" },
      { status: 500 }
    );
  }
}
