export type BatchStatus =
  | "received"
  | "cutting"
  | "stitching"
  | "interlock"
  | "press"
  | "ready"
  | "dispatched"
  | "billed";

export type AssignmentStatus = "in_progress" | "completed" | "paid";

export type KarigarType = "stitching" | "button";

export type CheckedBy = "home" | "press_vendor";

export type PaymentMode = "cash" | "cheque";

export type PaymentStatus = "pending" | "received";

export type SettlementMode = "cash" | "gpay";

export type LedgerEntryType = "withdrawal" | "rounding_carry";

export type GarmentType = "kurti" | "pant";

export type PaymentRequestStatus = "pending" | "acknowledged" | "settled";

/** Status color mapping for badges */
export const STATUS_COLORS: Record<BatchStatus, string> = {
  received: "bg-stone-200 text-stone-700",
  cutting: "bg-amber-100 text-amber-800",
  stitching: "bg-teal-100 text-teal-800",
  interlock: "bg-cyan-100 text-cyan-800",
  press: "bg-rose-100 text-rose-800",
  ready: "bg-blue-100 text-blue-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  billed: "bg-green-100 text-green-800",
};

/** Settlement preview returned by the engine */
export interface SettlementPreview {
  karigarId: number;
  karigarName: string;
  unpaidAssignments: {
    id: number;
    batchDesignName: string;
    piecesReturned: number;
    ratePerPiece: number;
    amount: number;
  }[];
  calculatedAmount: number;
  ledgerBalance: number;
  netPayable: number;
}
