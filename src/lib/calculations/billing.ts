import Decimal from "decimal.js";

/** TDS percentage constant — single source of truth */
export const TDS_PERCENT = 3;

export interface DispatchForBilling {
  id: number;
  piecesDispatched: number;
  batch: {
    ratePerPiece: string | number | Decimal;
    designName: string;
    color: string;
  };
}

export interface BillingCalculation {
  totalPieces: number;
  grossAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  netAmount: number;
}

/**
 * Calculate billing amounts from selected dispatches.
 * TDS applies only when payment mode is 'cheque'.
 */
export function calculateBilling(
  dispatches: DispatchForBilling[],
  paymentMode: "cash" | "cheque"
): BillingCalculation {
  const totalPieces = dispatches.reduce(
    (sum, d) => sum + d.piecesDispatched,
    0
  );

  const grossAmount = dispatches.reduce((sum, d) => {
    const rate = new Decimal(d.batch.ratePerPiece);
    const amount = rate.mul(d.piecesDispatched);
    return sum.add(amount);
  }, new Decimal(0));

  const tdsPercent = paymentMode === "cheque" ? TDS_PERCENT : 0;
  const tdsAmount = grossAmount.mul(tdsPercent).div(100);
  const netAmount = grossAmount.sub(tdsAmount);

  return {
    totalPieces,
    grossAmount: grossAmount.toDecimalPlaces(2).toNumber(),
    tdsPercent,
    tdsAmount: tdsAmount.toDecimalPlaces(2).toNumber(),
    netAmount: netAmount.toDecimalPlaces(2).toNumber(),
  };
}
