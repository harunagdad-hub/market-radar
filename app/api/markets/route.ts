import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const markets = await prisma.marketBranch.findMany({
      where: {
        isActive: true,
      },
      include: {
        chain: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(markets);
  } catch (error) {
    console.error("Markets API error:", error);

    return NextResponse.json(
      { error: "Marketler alınamadı." },
      { status: 500 }
    );
  }
}
