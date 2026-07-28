import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.KARIGAR_JWT_SECRET || "kaarigar-portal-secret-change-me";

export async function POST(request: Request) {
  try {
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone and PIN are required" },
        { status: 400 }
      );
    }

    const karigar = await prisma.karigar.findUnique({
      where: { phone: phone.trim() },
      select: { id: true, name: true, pinHash: true, active: true },
    });

    if (!karigar || !karigar.pinHash) {
      return NextResponse.json(
        { error: "Invalid phone number or PIN not set" },
        { status: 401 }
      );
    }

    if (!karigar.active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    const pinValid = await bcrypt.compare(pin.toString(), karigar.pinHash);
    if (!pinValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Issue karigar-scoped JWT (expires in 7 days)
    const token = jwt.sign(
      { karigarId: karigar.id, name: karigar.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      karigar: {
        id: karigar.id,
        name: karigar.name,
      },
    });
  } catch (error) {
    console.error("Karigar auth failed:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
