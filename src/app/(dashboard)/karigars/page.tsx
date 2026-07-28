"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/shared/FadeIn";
import { StaggerList, StaggerItem } from "@/components/shared/StaggerList";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { KarigarFormSheet } from "@/components/karigars/KarigarFormSheet";
import { KarigarCard } from "@/components/karigars/KarigarCard";
import { KarigarListSkeleton } from "@/components/karigars/KarigarListSkeleton";
import { Users, Search } from "lucide-react";
import { motion } from "framer-motion";

interface KarigarData {
  id: number;
  name: string;
  type: "stitching" | "button";
  gender: string | null;
  phone: string;
  active: boolean;
  selfPickup: boolean;
  createdAt: string;
}

export default function KarigarsPage() {
  const router = useRouter();
  const [karigars, setKarigars] = useState<KarigarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchKarigars();
  }, []);

  async function fetchKarigars() {
    try {
      const res = await fetch("/api/karigars");
      if (res.ok) {
        const data = await res.json();
        setKarigars(data);
      }
    } catch (error) {
      console.error("Failed to fetch karigars:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = karigars.filter((k) =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Karigars
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage stitching and button workers
            </p>
          </div>
          <KarigarFormSheet onSuccess={fetchKarigars} />
        </div>
      </FadeIn>

      {/* Search */}
      {!loading && karigars.length > 0 && (
        <FadeIn delay={0.05}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search karigars by name or phone..."
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
          </div>
        </FadeIn>
      )}

      {/* Loading State */}
      {loading && <KarigarListSkeleton />}

      {/* Empty State */}
      {!loading && karigars.length === 0 && (
        <FadeIn>
          <EmptyState
            title="No karigars yet"
            description="Add your first karigar to start tracking assignments and payments."
            actionLabel="Add First Karigar"
          />
        </FadeIn>
      )}

      {/* Filtered Empty State */}
      {!loading && karigars.length > 0 && filtered.length === 0 && (
        <FadeIn>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No karigars match your search
            </p>
          </div>
        </FadeIn>
      )}

      {/* Desktop Table */}
      {!loading && filtered.length > 0 && (
        <FadeIn delay={0.1}>
          {/* Desktop view */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Self Pickup
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k, idx) => (
                  <motion.tr
                    key={k.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/karigars/${k.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                          {k.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {k.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {k.type}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {k.gender ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {k.phone}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          k.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            k.active ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {k.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {k.selfPickup ? "Yes" : "No"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden">
            <StaggerList className="space-y-3">
              {filtered.map((k) => (
                <StaggerItem key={k.id}>
                  <KarigarCard {...k} />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {karigars.length} karigar
            {karigars.length !== 1 ? "s" : ""}
          </p>
        </FadeIn>
      )}
    </div>
  );
}
