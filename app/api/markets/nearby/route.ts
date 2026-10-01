import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius = Number(searchParams.get("radius") || "5");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Geçerli lat ve lng değerleri gerekli." },
        { status: 400 }
      );
    }

    const markets = await prisma.marketBranch.findMany({
      where: {
        isActive: true,
      },
      include: {
        chain: true,
      },
    });

    const nearbyMarkets = markets
      .filter((market) => market.latitude !== null && market.longitude !== null)
      .map((market) => ({
        ...market,
        distanceKm: distanceKm(
          lat,
          lng,
          market.latitude!,
          market.longitude!
        ),
      }))
      .filter((market) => market.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((market) => ({
        ...market,
        distanceKm: Number(market.distanceKm.toFixed(2)),
      }));

    return NextResponse.json({
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      count: nearbyMarkets.length,
      markets: nearbyMarkets,
    });
  } catch (error) {
    console.error("Nearby markets API error:", error);

    return NextResponse.json(
      { error: "Yakındaki marketler alınamadı." },
      { status: 500 }
    );
  }
}
