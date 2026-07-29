import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signKarigarToken, getKarigarJwtSecret } from "@/lib/karigar-jwt";

// Simple in-memory login attempt tracker (progressive lockout). For a distributed
// deployment, replace with a persisted counter (Redis/DB).
const loginAttempts = new Map<string, { count: number; firstAt: number; blockedUntil?: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_THRESHOLD = 5;
const BLOCK_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  try {
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone and PIN are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.trim();

    const karigar = await prisma.karigar.findUnique({
      where: { phone: normalizedPhone },
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

    // Rate limiting / progressive lockout keyed by normalized phone
    const now = Date.now();
    const record = loginAttempts.get(normalizedPhone) ?? { count: 0, firstAt: now };
    if (record.blockedUntil && record.blockedUntil > now) {
      return NextResponse.json({ error: "Too many attempts, try later" }, { status: 429 });
    }

    const pinValid = await bcrypt.compare(pin.toString(), karigar.pinHash);
    if (!pinValid) {
      // increment attempts
      if (now - record.firstAt > ATTEMPT_WINDOW_MS) {
        record.count = 1;
        record.firstAt = now;
      } else {
        record.count = (record.count || 0) + 1;
      }

      if (record.count >= ATTEMPT_THRESHOLD) {
        record.blockedUntil = now + BLOCK_MS;
      }

      loginAttempts.set(normalizedPhone, record);

      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // Successful login — reset counter
    loginAttempts.delete(normalizedPhone);

    // Issue karigar-scoped JWT (expires in 7 days)
    // Issue karigar-scoped JWT (expires in 7 days) and set as httpOnly cookie
    const token = signKarigarToken({ karigarId: karigar.id, name: karigar.name }, { expiresIn: "7d" });

    const cookie = `karigar_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; Secure; SameSite=Strict`;

    return NextResponse.json(
      {
        karigar: {
          id: karigar.id,
          name: karigar.name,
        },
      },
      { status: 200, headers: { "Set-Cookie": cookie } }
    );
  } catch (error) {
    console.error("Karigar auth failed:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
