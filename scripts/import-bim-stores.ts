import "dotenv/config";
import fs from "fs";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type BimStore = {
  chain: string;
  name: string;
  address: string;
  city: string;
  district: string;
  cityCode?: string;
  districtCode?: string;
  source?: string;
};

type Neighborhood = {
  id: number;
  name: string;
};

function norm(value: string | null | undefined) {
  return (value || "")
    .toUpperCase()
    .replaceAll("İ", "I")
    .replaceAll("Ş", "S")
    .replaceAll("Ğ", "G")
    .replaceAll("Ü", "U")
    .replaceAll("Ö", "O")
    .replaceAll("Ç", "C")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceId(store: BimStore) {
  return crypto
    .createHash("sha256")
    .update(
      [
        norm(store.city),
        norm(store.district),
        norm(store.name),
        norm(store.address),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 40);
}

async function main() {
  const stores: BimStore[] = JSON.parse(
    fs.readFileSync("data/bim-stores.json", "utf8")
  );

  const provinces = await prisma.province.findMany({
    include: {
      districts: {
        include: {
          neighborhoods: true,
        },
      },
    },
  });

  const provinceMap = new Map<string, typeof provinces[number]>();

  for (const province of provinces) {
    provinceMap.set(norm(province.name), province);
  }

  const cityAliases: Record<string, string> = {
    AFYON: "AFYONKARAHISAR",
    AGRI: "AGRI",
    "K MARAS": "KAHRAMANMARAS",
    ICEL: "MERSIN",
  };

  let imported = 0;
  let updated = 0;
  let neighborhoodMatched = 0;
  let neighborhoodMissing = 0;
  let provinceMissing = 0;
  let districtMissing = 0;

  for (const store of stores) {
    let cityKey = norm(store.city);

    if (cityAliases[cityKey]) {
      cityKey = cityAliases[cityKey];
    }

    const province = provinceMap.get(cityKey);

    if (!province) {
      provinceMissing++;
      continue;
    }

    const districtKey = norm(store.district);

    const district = province.districts.find(
      (d) => norm(d.name) === districtKey
    );

    if (!district) {
      districtMissing++;
    }

    let neighborhoodId: number | null = null;

    if (district) {
      const address = norm(store.address);

      for (const neighborhood of district.neighborhoods as Neighborhood[]) {
        let n = norm(neighborhood.name);

        n = n.replace(/\s+(MAHALLESI|MAH)$/g, "").trim();

        if (
          n.length >= 4 &&
          new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(
            address
          )
        ) {
          neighborhoodId = neighborhood.id;
          break;
        }
      }
    }

    if (neighborhoodId) {
      neighborhoodMatched++;
    } else {
      neighborhoodMissing++;
    }

    const sid = sourceId(store);

    const existing = await prisma.marketBranch.findFirst({
      where: {
        source: "BIM",
        sourceId: sid,
      },
      select: {
        id: true,
      },
    });

    const data = {
      chainId: 1,
      name: store.name.trim(),
      address: store.address.trim(),
      city: province.name,
      district: district?.name ?? store.district?.trim() ?? null,
      neighborhoodId,
      latitude: null,
      longitude: null,
      source: "BIM",
      sourceId: sid,
      isActive: true,
    };

    if (existing) {
      await prisma.marketBranch.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.marketBranch.create({
        data,
      });
      imported++;
    }

    if ((imported + updated) % 250 === 0) {
      console.log(
        `İşlenen: ${imported + updated}/${stores.length} | ` +
        `Yeni: ${imported} | Güncellenen: ${updated}`
      );
    }
  }

  console.log("");
  console.log("==============================================");
  console.log("BİM İMPORT TAMAMLANDI");
  console.log("==============================================");
  console.log(`JSON mağaza       : ${stores.length}`);
  console.log(`Yeni eklenen      : ${imported}`);
  console.log(`Güncellenen       : ${updated}`);
  console.log(`Mahalle eşleşen   : ${neighborhoodMatched}`);
  console.log(`Mahalle eşleşmeyen: ${neighborhoodMissing}`);
  console.log(`İl bulunamayan    : ${provinceMissing}`);
  console.log(`İlçe bulunamayan  : ${districtMissing}`);
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
