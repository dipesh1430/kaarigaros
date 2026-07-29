import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlementPreview } from "@/lib/calculations/settlement-engine";
import { getKarigarIdFromRequest } from "@/lib/karigar-jwt";

export async function GET(request: Request) {
  try {
    const karigarId = getKarigarIdFromRequest(request);
    const adminBearer = process.env.ADMIN_BEARER_TOKEN;

    if (karigarId) {
      const requests = await prisma.paymentRequest.findMany({
        where: { karigarId },
        include: { karigar: { select: { id: true, name: true } } },
        orderBy: { requestedAt: "desc" },
      });
      return NextResponse.json(requests);
    }

    // Dashboard/admin caller must present the admin bearer token
    const authHeader = request.headers.get("authorization");
    if (!adminBearer || authHeader !== `Bearer ${adminBearer}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.paymentRequest.findMany({
      include: { karigar: { select: { id: true, name: true } } },
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
    const karigarId = getKarigarIdFromRequest(request);
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
