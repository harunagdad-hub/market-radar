import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../src/lib/prisma";

type NeighborhoodData = {
  mahalle_id: string;
  mahalle_adi: string;
  mahalle_slug: string;
  posta_kodu?: string;
};

type DistrictData = {
  ilce_id: string;
  ilce_adi: string;
  ilce_slug: string;
  mahalleler: NeighborhoodData[];
};

type ProvinceData = {
  il_id: string;
  il_adi: string;
  il_slug: string;
  ilceler: DistrictData[];
};

async function main() {
  const file = "data/turkiye-adres/PTT/ptt_il_ilce_mahalle.json";

  console.log("Türkiye adres verisi okunuyor...");

  const data: ProvinceData[] = JSON.parse(
    fs.readFileSync(file, "utf-8")
  );

  console.log(`Toplam il: ${data.length}`);

  let districtCount = 0;
  let neighborhoodCount = 0;

  for (const provinceData of data) {
    const province = await prisma.province.upsert({
      where: {
        code: Number(provinceData.il_id),
      },
      update: {
        name: provinceData.il_adi,
      },
      create: {
        code: Number(provinceData.il_id),
        name: provinceData.il_adi,
      },
    });

    for (const districtData of provinceData.ilceler) {
      const district = await prisma.district.upsert({
        where: {
          provinceId_name: {
            provinceId: province.id,
            name: districtData.ilce_adi,
          },
        },
        update: {},
        create: {
          provinceId: province.id,
          name: districtData.ilce_adi,
        },
      });

      districtCount++;

      for (const neighborhoodData of districtData.mahalleler) {
        await prisma.neighborhood.upsert({
          where: {
            districtId_name: {
              districtId: district.id,
              name: neighborhoodData.mahalle_adi,
            },
          },
          update: {},
          create: {
            districtId: district.id,
            name: neighborhoodData.mahalle_adi,
          },
        });

        neighborhoodCount++;
      }
    }

    console.log(
      `${provinceData.il_adi}: ${provinceData.ilceler.length} ilçe işlendi`
    );
  }

  console.log("");
  console.log("=================================");
  console.log("Türkiye adres aktarımı tamamlandı");
  console.log(`İl: ${data.length}`);
  console.log(`İlçe: ${districtCount}`);
  console.log(`Mahalle: ${neighborhoodCount}`);
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("Import hatası:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
