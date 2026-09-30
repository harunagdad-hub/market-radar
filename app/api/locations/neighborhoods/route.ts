import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const districtId = Number(
      request.nextUrl.searchParams.get("districtId")
    );

    if (!districtId || Number.isNaN(districtId)) {
      return NextResponse.json(
        { error: "districtId gerekli." },
        { status: 400 }
      );
    }

    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        districtId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        districtId: true,
      },
    });

    return NextResponse.json({
      count: neighborhoods.length,
      neighborhoods,
    });
  } catch (error) {
    console.error("Neighborhoods API error:", error);

    return NextResponse.json(
      { error: "Mahalleler alınamadı." },
      { status: 500 }
    );
  }
}
