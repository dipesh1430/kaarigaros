import { prisma } from "@/lib/prisma";
import { createBillingSchema } from "@/lib/validations/billing.schema";
import { calculateBilling } from "@/lib/calculations/billing";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const billings = await prisma.billing.findMany({
      include: {
        merchant: { select: { name: true } },
        billingDispatches: {
          include: {
            dispatch: {
              include: {
                batch: { select: { designName: true, color: true } },
              },
            },
          },
        },
      },
      orderBy: { billingDate: "desc" },
    });

    return NextResponse.json(billings);
  } catch (error) {
    console.error("Failed to fetch billings:", error);
    return NextResponse.json(
      { error: "Failed to fetch billings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBillingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { merchantId, billingDate, dispatchIds, paymentMode, paymentStatus } =
      parsed.data;

    // Fetch associated dispatches with batch rates to calculate amounts
    const dispatches = await prisma.dispatch.findMany({
      where: { id: { in: dispatchIds } },
      include: {
        batch: { select: { ratePerPiece: true, designName: true, color: true } },
      },
    });

    if (dispatches.length !== dispatchIds.length) {
      return NextResponse.json(
        { error: "Some dispatches were not found" },
        { status: 400 }
      );
    }

    const calc = calculateBilling(dispatches, paymentMode);

    // Create billing + billing-dispatch links + update batch statuses in a transaction
    const billing = await prisma.$transaction(async (tx) => {
      const created = await tx.billing.create({
        data: {
          merchantId,
          billingDate: new Date(billingDate),
          totalPieces: calc.totalPieces,
          grossAmount: calc.grossAmount,
          tdsPercent: calc.tdsPercent,
          tdsAmount: calc.tdsAmount,
          netAmount: calc.netAmount,
          paymentMode,
          paymentStatus,
          billingDispatches: {
            create: dispatchIds.map((dispatchId) => ({ dispatchId })),
          },
        },
        include: {
          merchant: { select: { name: true } },
          billingDispatches: {
            include: {
              dispatch: {
                include: {
                  batch: { select: { designName: true } },
                },
              },
            },
          },
        },
      });

      // Mark linked batches as 'billed'
      const batchIds = dispatches.map((d) => d.batchId);
      await tx.batch.updateMany({
        where: { id: { in: batchIds } },
        data: { status: "billed" },
      });

      return created;
    });

    return NextResponse.json(billing, { status: 201 });
  } catch (error) {
    console.error("Failed to create billing:", error);
    return NextResponse.json(
      { error: "Failed to create billing" },
      { status: 500 }
    );
  }
}
