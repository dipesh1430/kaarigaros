import { prisma } from "@/lib/prisma";
import { karigarSchema } from "@/lib/validations/karigar.schema";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const karigarId = parseInt(id, 10);

    if (isNaN(karigarId)) {
      return NextResponse.json({ error: "Invalid karigar ID" }, { status: 400 });
    }

    const karigar = await prisma.karigar.findUnique({
      where: { id: karigarId },
      include: {
        assignments: {
          include: {
            batch: { select: { designName: true, color: true, ratePerPiece: true } },
          },
          orderBy: { dateGiven: "desc" },
        },
        ledgerEntries: {
          orderBy: { entryDate: "desc" },
        },
        settlements: {
          include: {
            items: true,
          },
          orderBy: { settlementDate: "desc" },
        },
      },
    });

    if (!karigar) {
      return NextResponse.json({ error: "Karigar not found" }, { status: 404 });
    }

    return NextResponse.json(karigar);
  } catch (error) {
    console.error("Failed to fetch karigar:", error);
    return NextResponse.json(
      { error: "Failed to fetch karigar" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const karigarId = parseInt(id, 10);

    if (isNaN(karigarId)) {
      return NextResponse.json({ error: "Invalid karigar ID" }, { status: 400 });
    }

    const existing = await prisma.karigar.findUnique({
      where: { id: karigarId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Karigar not found" }, { status: 404 });
    }

    const body = await request.json();

    // Allow partial updates + active toggle
    const parsed = karigarSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const karigar = await prisma.karigar.update({
      where: { id: karigarId },
      data: parsed.data,
    });

    return NextResponse.json(karigar);
  } catch (error) {
    console.error("Failed to update karigar:", error);
    return NextResponse.json(
      { error: "Failed to update karigar" },
      { status: 500 }
    );
  }
}
