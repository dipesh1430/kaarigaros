import { prisma } from "@/lib/prisma";
import { karigarSchema } from "@/lib/validations/karigar.schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const karigars = await prisma.karigar.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(karigars);
  } catch (error) {
    console.error("Failed to fetch karigars:", error);
    return NextResponse.json(
      { error: "Failed to fetch karigars" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = karigarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const karigar = await prisma.karigar.create({
      data: parsed.data,
    });

    return NextResponse.json(karigar, { status: 201 });
  } catch (error) {
    console.error("Failed to create karigar:", error);
    return NextResponse.json(
      { error: "Failed to create karigar" },
      { status: 500 }
    );
  }
}
