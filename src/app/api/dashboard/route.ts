import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      activeBatches,
      pendingDispatches,
      payableResult,
      receivableResult,
      recentActivity,
      batchStatusCounts,
      pendingRequests,
    ] = await Promise.all([
      // Active batches (not dispatched/billed)
      prisma.batch.count({
        where: { status: { notIn: ["dispatched", "billed"] } },
      }),

      // Ready but not yet dispatched
      prisma.batch.count({
        where: { status: "ready" },
      }),

      // Pending payouts — sum of unpaid completed assignments
      // Pending payouts — we'll compute from assignments directly
      prisma.karigarAssignment.findMany({
        where: {
          status: "completed",
          settlementItems: { none: {} },
        },
        select: {
          piecesReturned: true,
          batch: { select: { ratePerPiece: true } },
        },
      }),

      // Receivable — sum of pending billings
      prisma.billing.aggregate({
        where: { paymentStatus: "pending" },
        _sum: { netAmount: true },
      }),

      // Recent activity — last 10 changes (use updatedAt so status changes surface)
      prisma.batch.findMany({
        select: {
          id: true,
          designName: true,
          color: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Batch count per status
      prisma.batch.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Pending payment requests
      prisma.paymentRequest.count({
        where: { status: "pending" },
      }),
    ]);

    // Compute payable from assignments data
    const payableAssignments = payableResult as {
      piecesReturned: number | null;
      batch: { ratePerPiece: any };
    }[];

    const payableToKarigars = payableAssignments.reduce((sum, a) => {
      const rate = Number(a.batch.ratePerPiece);
      const pieces = a.piecesReturned ?? 0;
      return sum + rate * pieces;
    }, 0);

    const receivable = Number(receivableResult._sum?.netAmount ?? 0);

    return NextResponse.json({
      activeBatches,
      pendingDispatches,
      payableToKarigars: Math.round(payableToKarigars * 100) / 100,
      receivable,
      cashFlowGap: receivable - payableToKarigars,
      recentActivity,
      batchStatusCounts,
      pendingPaymentRequests: pendingRequests,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
