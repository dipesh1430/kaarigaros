"use client";

import { motion } from "framer-motion";
import { UserCheck, UserX, Phone, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface KarigarCardProps {
  id: number;
  name: string;
  type: "stitching" | "button";
  gender: string | null;
  phone: string;
  active: boolean;
  selfPickup: boolean;
}

export function KarigarCard({
  id,
  name,
  type,
  gender,
  phone,
  active,
  selfPickup,
}: KarigarCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
      }}
    >
      <Link
        href={`/karigars/${id}`}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
      >
        {/* Avatar placeholder */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
            type === "stitching" ? "bg-secondary" : "bg-accent"
          )}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {name}
            </span>
            {active ? (
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-success" />
            ) : (
              <UserX className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="capitalize">{type}</span>
            {gender && <span>{gender}</span>}
            {selfPickup && <span>Self pickup</span>}
          </div>
        </div>

        {/* Phone */}
        <a
          href={`tel:${phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
        >
          <Phone className="h-3.5 w-3.5" />
          {phone}
        </a>
      </Link>
    </motion.div>
  );
}
