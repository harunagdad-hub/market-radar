import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const provinces = await prisma.province.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return NextResponse.json({
      count: provinces.length,
      provinces,
    });
  } catch (error) {
    console.error("Provinces API error:", error);

    return NextResponse.json(
      { error: "İller alınamadı." },
      { status: 500 }
    );
  }
}
