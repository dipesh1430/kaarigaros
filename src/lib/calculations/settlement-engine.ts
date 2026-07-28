import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

/* ──────────────────────────────────────────────────────────────────
   Settlement Engine — THE core business logic of KaarigarOS

   This is an event-sourced, bundle-based payroll engine.
   Every settlement is calculated from live DB data — never trusted
   from client input except for 'amountPaid' and 'paymentMode'.

   Ledger convention: +ve = karigar owes company, -ve = company owes karigar
   ────────────────────────────────────────────────────────────────── */

export interface UnpaidAssignment {
  id: number;
  piecesReturned: number;
  ratePerPiece: Decimal;
  batchDesignName: string;
  batchColor: string;
}

export interface SettlementPreview {
  karigarId: number;
  karigarName: string;
  unpaidAssignments: {
    id: number;
    piecesReturned: number;
    ratePerPiece: number;
    batchDesignName: string;
    batchColor: string;
    amount: number;
  }[];
  calculatedAmount: number;
  ledgerBalance: number;
  netPayable: number;
  openWithdrawals: { id: number; amount: number; notes: string | null }[];
}

/**
 * Calculate settlement preview for a karigar without saving anything.
 * This is a read-only function — it never writes to the DB.
 */
export async function calculateSettlementPreview(
  karigarId: number
): Promise<SettlementPreview> {
  // Fetch unpaid completed assignments (not yet linked to any settlement item)
  const unpaidAssignments = await prisma.karigarAssignment.findMany({
    where: {
      karigarId,
      status: "completed",
      settlementItems: { none: {} },
    },
    include: {
      batch: {
        select: {
          designName: true,
          color: true,
          ratePerPiece: true,
        },
      },
    },
    orderBy: { dateCollected: "asc" },
  });

  // Fetch open ledger entries (not yet linked to a settlement)
  const openLedger = await prisma.karigarLedger.findMany({
    where: {
      karigarId,
      relatedSettlementId: null,
    },
    orderBy: { entryDate: "asc" },
  });

  // Calculate using Decimal for precision
  const calculatedAmount = unpaidAssignments.reduce(
    (sum, a) => sum.add(new Decimal(a.piecesReturned ?? 0).mul(new Decimal(a.batch.ratePerPiece))),
    new Decimal(0)
  );

  const ledgerBalance = openLedger.reduce(
    (sum, entry) => sum.add(new Decimal(entry.amount)),
    new Decimal(0)
  );

  const netPayable = calculatedAmount.sub(ledgerBalance);

  return {
    karigarId,
    karigarName: "",
    unpaidAssignments: unpaidAssignments.map((a) => ({
      id: a.id,
      piecesReturned: a.piecesReturned!,
      ratePerPiece: Number(a.batch.ratePerPiece),
      batchDesignName: a.batch.designName,
      batchColor: a.batch.color,
      amount: new Decimal(a.piecesReturned!)
        .mul(new Decimal(a.batch.ratePerPiece))
        .toDecimalPlaces(2)
        .toNumber(),
    })),
    calculatedAmount: calculatedAmount.toDecimalPlaces(2).toNumber(),
    ledgerBalance: ledgerBalance.toDecimalPlaces(2).toNumber(),
    netPayable: netPayable.toDecimalPlaces(2).toNumber(),
    openWithdrawals: openLedger
      .filter((e) => e.entryType === "withdrawal")
      .map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        notes: e.notes,
      })),
  };
}

export interface ConfirmedSettlement {
  settlementId: number;
  calculatedAmount: number;
  ledgerBalanceBefore: number;
  netPayable: number;
  amountPaid: number;
  roundingDiff: number;
  paymentMode: string;
  assignmentCount: number;
}

/**
 * Confirm and save a settlement.
 * This is a write operation that runs in a DB transaction:
 * 1. Re-calculates everything server-side (never trusts client numbers)
 * 2. Creates the settlement record
 * 3. Creates settlement items for each unpaid assignment
 * 4. Marks assignments as 'paid'
 * 5. Closes open ledger entries
 * 6. Creates a rounding_carry entry if amountPaid ≠ netPayable
 */
export async function confirmSettlement(
  karigarId: number,
  amountPaid: number,
  paymentMode: "cash" | "gpay"
): Promise<ConfirmedSettlement> {
  // Re-calculate preview server-side — never trust client numbers
  const preview = await calculateSettlementPreview(karigarId);

  if (preview.unpaidAssignments.length === 0) {
    throw new Error("No unpaid completed assignments to settle");
  }

  const roundingDiff = new Decimal(amountPaid).sub(
    new Decimal(preview.netPayable)
  );

  // Run everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the settlement
    const settlement = await tx.karigarSettlement.create({
      data: {
        karigarId,
        settlementDate: new Date(),
        calculatedAmount: preview.calculatedAmount,
        ledgerBalanceBefore: preview.ledgerBalance,
        netPayable: preview.netPayable,
        amountPaid,
        roundingDiff: roundingDiff.toDecimalPlaces(2).toNumber(),
        paymentMode,
      },
    });

    // 2. Create settlement items + mark assignments paid
    for (const assignment of preview.unpaidAssignments) {
      await tx.settlementItem.create({
        data: {
          settlementId: settlement.id,
          assignmentId: assignment.id,
          piecesCounted: assignment.piecesReturned,
          amount: assignment.amount,
        },
      });

      await tx.karigarAssignment.update({
        where: { id: assignment.id },
        data: { status: "paid" },
      });
    }

    // 3. Close open ledger entries (link to this settlement)
    await tx.karigarLedger.updateMany({
      where: {
        karigarId,
        relatedSettlementId: null,
      },
      data: {
        relatedSettlementId: settlement.id,
      },
    });

    // 4. Create rounding_carry entry if diff ≠ 0
    if (!roundingDiff.isZero()) {
      await tx.karigarLedger.create({
        data: {
          karigarId,
          entryDate: new Date(),
          entryType: "rounding_carry",
          amount: roundingDiff.toDecimalPlaces(2).toNumber(),
          relatedSettlementId: settlement.id,
          notes:
            roundingDiff.gt(0)
              ? `Rounding overpayment (₹${roundingDiff.toFixed(2)}) credited for next settlement`
              : `Rounding underpayment (₹${roundingDiff.abs().toFixed(2)}) carried to next settlement`,
        },
      });
    }

    return settlement;
  });

  return {
    settlementId: result.id,
    calculatedAmount: Number(result.calculatedAmount),
    ledgerBalanceBefore: Number(result.ledgerBalanceBefore),
    netPayable: Number(result.netPayable),
    amountPaid: Number(result.amountPaid),
    roundingDiff: Number(result.roundingDiff),
    paymentMode: result.paymentMode,
    assignmentCount: preview.unpaidAssignments.length,
  };
}

/**
 * Get the current pending payout for a karigar (used in dashboard + karigar portal).
 * This is the same logic as calculateSettlementPreview.netPayable.
 */
export async function getPendingPayout(karigarId: number): Promise<number> {
  const preview = await calculateSettlementPreview(karigarId);
  return preview.netPayable;
}
