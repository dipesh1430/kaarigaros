import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Decimal from "decimal.js";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number/Decimal/string as Indian Rupee currency */
export function formatCurrency(amount: number | string | Decimal): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Format a Date to DD MMM YYYY (e.g. "28 Jul 2026") */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** TDS percentage constant — single source of truth */
export const TDS_PERCENT = 3;
