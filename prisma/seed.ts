import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Market Radar demo verileri ekleniyor...");

  const chains = [
    { name: "BİM", slug: "bim" },
    { name: "A101", slug: "a101" },
    { name: "ŞOK", slug: "sok" },
    { name: "Migros", slug: "migros" },
  ];

  const chainMap: Record<string, number> = {};

  for (const chain of chains) {
    const result = await prisma.marketChain.upsert({
      where: { slug: chain.slug },
      update: {
        name: chain.name,
        isActive: true,
      },
      create: {
        name: chain.name,
        slug: chain.slug,
      },
    });

    chainMap[chain.slug] = result.id;
  }

  const branches = [
    {
      chainId: chainMap.bim,
      name: "BİM Erzincan Merkez",
      address: "İnönü Mahallesi, Erzincan Merkez",
      city: "Erzincan",
      district: "Merkez",
      latitude: 39.750,
      longitude: 39.490,
    },
    {
      chainId: chainMap.a101,
      name: "A101 Erzincan Merkez",
      address: "İnönü Mahallesi, Erzincan Merkez",
      city: "Erzincan",
      district: "Merkez",
      latitude: 39.748,
      longitude: 39.495,
    },
    {
      chainId: chainMap.sok,
      name: "ŞOK Erzincan Merkez",
      address: "Atatürk Mahallesi, Erzincan Merkez",
      city: "Erzincan",
      district: "Merkez",
      latitude: 39.753,
      longitude: 39.487,
    },
    {
      chainId: chainMap.migros,
      name: "Migros Erzincan Merkez",
      address: "Halitpaşa Mahallesi, Erzincan Merkez",
      city: "Erzincan",
      district: "Merkez",
      latitude: 39.755,
      longitude: 39.492,
    },
  ];

  for (const branch of branches) {
    const existing = await prisma.marketBranch.findFirst({
      where: {
        chainId: branch.chainId,
        name: branch.name,
      },
    });

    if (existing) {
      await prisma.marketBranch.update({
        where: { id: existing.id },
        data: branch,
      });
    } else {
      await prisma.marketBranch.create({
        data: branch,
      });
    }
  }

  const products = [
    {
      name: "Çaykur Tiryaki Çay 1 kg",
      barcode: "869000000001",
      brand: "Çaykur",
      category: "Çay",
      unit: "1 kg",
    },
    {
      name: "Sütaş Tam Yağlı Süt 1 L",
      barcode: "869000000002",
      brand: "Sütaş",
      category: "Süt",
      unit: "1 L",
    },
    {
      name: "Torku Toz Şeker 1 kg",
      barcode: "869000000003",
      brand: "Torku",
      category: "Şeker",
      unit: "1 kg",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: product,
      create: product,
    });
  }

  console.log("Demo market ve ürün verileri hazır.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
