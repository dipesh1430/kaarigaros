import Decimal from "decimal.js";

/**
 * Calculate fabric yield percentage.
 * yield% = (fabricUsed / fabricReceived) * 100
 */
export function calculateYieldPercent(
  fabricUsedMeters: number | string | Decimal,
  fabricReceivedMeters: number | string | Decimal
): number {
  const used = new Decimal(fabricUsedMeters);
  const received = new Decimal(fabricReceivedMeters);

  if (received.isZero()) return 0;
  return used.div(received).mul(100).toDecimalPlaces(2).toNumber();
}

/**
 * Calculate total yield across multiple cutting logs.
 */
export function calculateTotalYield(
  logs: { fabricUsedMeters: string | number }[],
  fabricReceivedMeters: number | string
): number {
  const totalUsed = logs.reduce(
    (sum, log) => sum + new Decimal(log.fabricUsedMeters).toNumber(),
    0
  );
  return calculateYieldPercent(totalUsed, fabricReceivedMeters);
}
