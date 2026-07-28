import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmSettlement } from "@/lib/calculations/settlement-engine";

export async function GET() {
  try {
    const settlements = await prisma.karigarSettlement.findMany({
      include: {
        karigar: { select: { name: true, type: true } },
        items: {
          include: {
            assignment: {
              include: {
                batch: { select: { designName: true, color: true } },
              },
            },
          },
        },
      },
      orderBy: { settlementDate: "desc" },
    });

    return NextResponse.json(settlements);
  } catch (error) {
    console.error("Failed to fetch settlements:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { karigarId, amountPaid, paymentMode } = body;

    if (!karigarId || amountPaid === undefined || !paymentMode) {
      return NextResponse.json(
        { error: "karigarId, amountPaid, and paymentMode are required" },
        { status: 400 }
      );
    }

    if (!["cash", "gpay"].includes(paymentMode)) {
      return NextResponse.json(
        { error: "paymentMode must be 'cash' or 'gpay'" },
        { status: 400 }
      );
    }

    if (typeof amountPaid !== "number" || amountPaid <= 0) {
      return NextResponse.json(
        { error: "amountPaid must be a positive number" },
        { status: 400 }
      );
    }

    // Verify karigar exists
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

    const result = await confirmSettlement(
      karigarId,
      amountPaid,
      paymentMode as "cash" | "gpay"
    );

    return NextResponse.json(
      {
        ...result,
        karigarName: karigar.name,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process settlement";

    if (message.includes("No unpaid completed assignments")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Failed to process settlement:", error);
    return NextResponse.json(
      { error: "Failed to process settlement" },
      { status: 500 }
    );
  }
}
