import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding KaarigarOS...");

  // ── Merchant: Laxmi Krupa Creation ──
  const merchant = await prisma.merchant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Laxmi Krupa Creation",
      contactPerson: "Jignesh bhai",
      phone: "9876543210",
      address: "Ahmedabad, Gujarat",
    },
  });
  console.log(`✓ Merchant: ${merchant.name}`);

  // ── Karigars ──
  const karigars = [
    {
      name: "Ramesh bhai",
      type: "stitching" as const,
      gender: "Male",
      phone: "9876543211",
      selfPickup: false,
    },
    {
      name: "Suresh bhai",
      type: "stitching" as const,
      gender: "Male",
      phone: "9876543212",
      selfPickup: true,
    },
    {
      name: "Mira ben",
      type: "button" as const,
      gender: "Female",
      phone: "9876543213",
      selfPickup: false,
    },
  ];

  for (const k of karigars) {
    await prisma.karigar.upsert({
      where: { phone: k.phone },
      update: {},
      create: k,
    });
  }
  console.log(`✓ ${karigars.length} karigars seeded`);

  // ── Sample Batch ──
  const batch = await prisma.batch.create({
    data: {
      merchantId: merchant.id,
      designName: "Design A — Printed Kurti",
      color: "Red",
      garmentType: "kurti",
      fabricReceivedMeters: 500,
      ratePerPiece: 45,
      totalPiecesPlanned: 500,
      dateReceived: new Date("2026-07-01"),
      status: "received",
    },
  });
  console.log(`✓ Sample batch: ${batch.designName} (${batch.color})`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
