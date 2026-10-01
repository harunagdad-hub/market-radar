import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json(
        { error: "q parametresi gerekli." },
        { status: 400 }
      );
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");

    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "tr");
    url.searchParams.set("accept-language", "tr");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "MarketRadar/1.0 (market-radar)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding servisine ulaşılamadı." },
        { status: 502 }
      );
    }

    const results = await response.json();

    return NextResponse.json({
      count: results.length,
      results,
      attribution: "© OpenStreetMap contributors",
    });
  } catch (error) {
    console.error("Geocode API error:", error);

    return NextResponse.json(
      { error: "Adres koordinata çevrilemedi." },
      { status: 500 }
    );
  }
}
