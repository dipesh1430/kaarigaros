import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlementPreview } from "@/lib/calculations/settlement-engine";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.KARIGAR_JWT_SECRET || "kaarigar-portal-secret-change-me";

function getKarigarId(request: Request): number | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { karigarId: number };
    return decoded.karigarId;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const requests = await prisma.paymentRequest.findMany({
      include: {
        karigar: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch payment requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify this is a karigar request via JWT
    const karigarId = getKarigarId(request);
    if (!karigarId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify karigarId matches the one in the body (prevent viewing others' data)
    const body = await request.json();
    if (body.karigarId !== karigarId) {
      return NextResponse.json(
        { error: "Cannot request payment for another karigar" },
        { status: 403 }
      );
    }

    // Calculate current pending payout
    const preview = await calculateSettlementPreview(karigarId);

    if (preview.netPayable <= 0) {
      return NextResponse.json(
        { error: "No pending amount to request" },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existing = await prisma.paymentRequest.findFirst({
      where: {
        karigarId,
        status: "pending",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending payment request" },
        { status: 400 }
      );
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        karigarId,
        amountOwedAtRequest: preview.netPayable,
        status: "pending",
      },
      include: {
        karigar: { select: { name: true } },
      },
    });

    return NextResponse.json({
      ...paymentRequest,
      whatsappUrl: `https://wa.me/919876543210?text=${encodeURIComponent(
        `${paymentRequest.karigar.name} requested payment of ₹${preview.netPayable}. — via KaarigarOS`
      )}`,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment request:", error);
    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 }
    );
  }
}
