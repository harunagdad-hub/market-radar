import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const provinceId = Number(
      request.nextUrl.searchParams.get("provinceId")
    );

    if (!provinceId || Number.isNaN(provinceId)) {
      return NextResponse.json(
        { error: "provinceId gerekli." },
        { status: 400 }
      );
    }

    const districts = await prisma.district.findMany({
      where: {
        provinceId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        provinceId: true,
      },
    });

    return NextResponse.json({
      count: districts.length,
      districts,
    });
  } catch (error) {
    console.error("Districts API error:", error);

    return NextResponse.json(
      { error: "İlçeler alınamadı." },
      { status: 500 }
    );
  }
}
