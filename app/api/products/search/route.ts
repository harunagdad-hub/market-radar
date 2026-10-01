import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseNum(v: string | null) {
  if (v === null || v.trim() === "") return NaN;
  return Number(v);
}

export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;
    const q = (sp.get("q") || "").trim();
    const lat = parseNum(sp.get("lat"));
    const lng = parseNum(sp.get("lng"));
    const rParam = parseNum(sp.get("radius"));
    const radius = Math.min(Number.isFinite(rParam) ? rParam : 5, 50);

    if (q.length < 2) {
      return NextResponse.json({ error: "En az 2 karakterlik q gerekli." }, { status: 400 });
    }
    if (
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180
    ) {
      return NextResponse.json({ error: "Geçerli lat ve lng gerekli." }, { status: 400 });
    }

    // 1) Yakındaki şubeler (bounding box + haversine)
    const dLat = radius / 111.32;
    const dLng = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
    const candidates = await prisma.marketBranch.findMany({
      where: {
        isActive: true,
        latitude: { gte: lat - dLat, lte: lat + dLat },
        longitude: { gte: lng - dLng, lte: lng + dLng },
      },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    const branches = new Map(
      candidates
        .map((b) => ({ ...b, km: distanceKm(lat, lng, b.latitude!, b.longitude!) }))
        .filter((b) => b.km <= radius)
        .map((b) => [b.id, b] as const)
    );

    if (branches.size === 0) {
      return NextResponse.json({ query: q, count: 0, products: [] });
    }

    // 2) Bu şubelerdeki eşleşen fiyatlar, en yeniden eskiye
    const rows = await prisma.price.findMany({
      where: {
        branchId: { in: [...branches.keys()] },
        listing: { name: { contains: q, mode: "insensitive" } },
      },
      include: {
        listing: { include: { chain: true } },
      },
      orderBy: { validFrom: "desc" },
      take: 3000,
    });

    // 3) Her (listing, şube) için sadece en güncel fiyat
    const seen = new Set<string>();
    const byProduct = new Map<
      string,
      {
        productId: number | null;
        name: string;
        brand: string | null;
        unit: string | null;
        imageUrl: string | null;
        offers: {
          chain: string;
          branch: string;
          distanceKm: number;
          price: number;
          updatedAt: Date;
        }[];
      }
    >();

    for (const r of rows) {
      const key = `${r.listingId}:${r.branchId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const l = r.listing;
      const groupKey = l.productId ? `p${l.productId}` : `l${l.id}`;
      const b = branches.get(r.branchId)!;
      let g = byProduct.get(groupKey);
      if (!g) {
        g = {
          productId: l.productId,
          name: l.name,
          brand: l.brand,
          unit: l.unit,
          imageUrl: l.imageUrl,
          offers: [],
        };
        byProduct.set(groupKey, g);
      }
      g.offers.push({
        chain: l.chain.name,
        branch: b.name,
        distanceKm: Number(b.km.toFixed(2)),
        price: Number(r.price),
        updatedAt: r.validFrom,
      });
    }

    const products = [...byProduct.values()]
      .map((g) => {
        g.offers.sort((a, b) => a.price - b.price);
        return { ...g, cheapest: g.offers[0], offerCount: g.offers.length };
      })
      .sort((a, b) => b.offerCount - a.offerCount || a.cheapest.price - b.cheapest.price)
      .slice(0, 30);

    return NextResponse.json({
      query: q,
      radiusKm: radius,
      branchCount: branches.size,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Product search API error:", error);
    return NextResponse.json({ error: "Ürün araması başarısız." }, { status: 500 });
  }
}
