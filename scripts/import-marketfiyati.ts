import { prisma } from "../src/lib/prisma";

const BASE = "https://api.marketfiyati.org.tr/api/v2";

const CHAIN_NAMES: Record<string, string> = {
  bim: "BİM",
  a101: "A101",
  sok: "ŞOK",
  migros: "Migros",
  carrefour: "CarrefourSA",
  tarim_kredi: "Tarım Kredi",
};

type Nearest = {
  id: string;
  sellerName: string;
  marketName: string;
  location: { lat: number; lon: number };
  distance: number;
};
type DepotInfo = {
  depotId: string;
  price: number;
  marketAdi: string;
  indexTime?: string;
};
type Item = {
  id: string;
  title: string;
  brand?: string | null;
  imageUrl?: string | null;
  refinedVolumeOrWeight?: string | null;
  main_category?: string | null;
  productDepotInfoList: DepotInfo[];
};
type SearchResponse = { numberOfFound: number; content: Item[] };

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn(path, "HTTP", res.status);
    return null;
  }
  return (await res.json()) as T;
}

// "30.09.2026 12:18" (Türkiye saati) -> Date
function parseIndexTime(s?: string): Date {
  const m = s?.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/);
  if (!m) return new Date();
  return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00+03:00`);
}

const chainCache = new Map<string, number>();
async function chainId(slug: string) {
  const cached = chainCache.get(slug);
  if (cached) return cached;
  const name = CHAIN_NAMES[slug] ?? slug;
  let chain = await prisma.marketChain.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (!chain) chain = await prisma.marketChain.create({ data: { slug, name } });
  chainCache.set(slug, chain.id);
  return chain.id;
}

async function saveItem(item: Item, branchByDepot: Map<string, number>) {
  const product = await prisma.product.upsert({
    where: { externalId: item.id },
    update: { name: item.title, brand: item.brand, imageUrl: item.imageUrl },
    create: {
      externalId: item.id,
      name: item.title,
      brand: item.brand,
      category: item.main_category,
      unit: item.refinedVolumeOrWeight,
      imageUrl: item.imageUrl,
    },
  });

  let saved = 0;
  for (const info of item.productDepotInfoList) {
    const branchId = branchByDepot.get(info.depotId);
    if (!branchId) continue;
    const cId = await chainId(info.marketAdi);

    const listing = await prisma.productListing.upsert({
      where: { chainId_sourceSku: { chainId: cId, sourceSku: item.id } },
      update: {
        name: item.title,
        brand: item.brand,
        unit: item.refinedVolumeOrWeight,
        imageUrl: item.imageUrl,
        productId: product.id,
      },
      create: {
        chainId: cId,
        sourceSku: item.id,
        name: item.title,
        brand: item.brand,
        unit: item.refinedVolumeOrWeight,
        imageUrl: item.imageUrl,
        productId: product.id,
      },
    });

    // Fiyat değişmediyse yeni satır yazma
    const last = await prisma.price.findFirst({
      where: { listingId: listing.id, branchId },
      orderBy: { validFrom: "desc" },
    });
    if (last && Number(last.price) === info.price) continue;

    await prisma.price.create({
      data: {
        listingId: listing.id,
        branchId,
        price: info.price,
        source: "IMPORT",
        validFrom: parseIndexTime(info.indexTime),
      },
    });
    saved++;
  }
  return saved;
}

async function main() {
  const lat = Number(arg("lat", "39.9334"));
  const lng = Number(arg("lng", "32.8597"));
  const distance = Number(arg("distance", "5"));
  const city = arg("city", "Ankara");
  const pages = Number(arg("pages", "2"));
  const terms = arg("terms", "süt,ekmek,yumurta,yağ,şeker,makarna,pirinç,çay")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const depots = await post<Nearest[]>("/nearest", {
    latitude: lat,
    longitude: lng,
    distance,
  });
  if (!depots?.length) {
    console.error("Yakında depo bulunamadı.");
    return;
  }

  const branchByDepot = new Map<string, number>();
  for (const d of depots) {
    const cId = await chainId(d.marketName);
    const existing = await prisma.marketBranch.findFirst({
      where: { source: "marketfiyati", sourceId: d.id },
    });
    const data = {
      chainId: cId,
      name: d.sellerName,
      city,
      latitude: d.location.lat,
      longitude: d.location.lon,
    };
    const branch = existing
      ? await prisma.marketBranch.update({ where: { id: existing.id }, data })
      : await prisma.marketBranch.create({
          data: { ...data, address: "", source: "marketfiyati", sourceId: d.id },
        });
    branchByDepot.set(d.id, branch.id);
  }
  console.log(`${branchByDepot.size} şube hazır.`);

  const depotIds = [...branchByDepot.keys()];
  let totalPrices = 0;

  for (const term of terms) {
    for (let page = 0; page < pages; page++) {
      await sleep(700); // resmi olmayan API, nazik davran
      const res = await post<SearchResponse>("/search", {
        keywords: term,
        pages: page,
        size: 50,
        latitude: lat,
        longitude: lng,
        distance,
        depots: depotIds,
      });
      if (!res?.content?.length) break;

      let saved = 0;
      for (const item of res.content) saved += await saveItem(item, branchByDepot);
      totalPrices += saved;
      console.log(`"${term}" sayfa ${page}: ${res.content.length} ürün, ${saved} yeni fiyat`);
    }
  }

  const [products, prices] = await Promise.all([
    prisma.product.count(),
    prisma.price.count(),
  ]);
  console.log(`Bitti. Bu çalıştırmada ${totalPrices} fiyat. Toplam ürün: ${products}, fiyat: ${prices}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
