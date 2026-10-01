"use client";

import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";

type MapFeature = {
  id: string;
  code: number;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
};

type Province = {
  id: number;
  code: number;
  name: string;
};

type District = {
  id: number;
  name: string;
  provinceId: number;
};

type Neighborhood = {
  id: number;
  name: string;
  districtId: number;
};

export default function TurkeyMapClient({
  features,
  provinces,
}: {
  features: MapFeature[];
  provinces: Province[];
}) {
  const [selectedProvince, setSelectedProvince] =
    useState<Province | null>(null);

  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [selectedDistrict, setSelectedDistrict] =
    useState<District | null>(null);

  const [neighborhoods, setNeighborhoods] =
    useState<Neighborhood[]>([]);

  const [loadingNeighborhoods, setLoadingNeighborhoods] =
    useState(false);

  const width = 1100;
  const height = 650;

  const geoFeatures = useMemo(
    () =>
      features.map((feature) => ({
        type: "Feature" as const,
        properties: {
          code: feature.code,
        },
        geometry: feature.geometry as any,
      })),
    [features]
  );

  const projection = useMemo(
    () =>
      geoMercator().fitExtent(
        [
          [25, 20],
          [width - 25, height - 20],
        ],
        {
          type: "FeatureCollection",
          features: geoFeatures,
        } as any
      ),
    [geoFeatures]
  );

  const pathGenerator = useMemo(
    () => geoPath(projection),
    [projection]
  );

  async function handleProvinceClick(code: number) {
    const province = provinces.find(
      (item) => item.code === code
    );

    if (!province) {
      console.error("Province bulunamadı:", code);
      return;
    }

    console.log(
      "Seçilen il:",
      province.name,
      "DB id:",
      province.id,
      "code:",
      province.code
    );

    setSelectedProvince(province);
    setDistricts([]);
    setLoadingDistricts(true);

    try {
      const response = await fetch(
        `/api/locations/districts?provinceId=${province.id}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("İlçeler alınamadı");
      }

      const data = await response.json();

      console.log("İlçe API sonucu:", data);

      const result: District[] = Array.isArray(data)
        ? data
        : data.districts ?? [];

      setDistricts(result);
    } catch (error) {
      console.error("Districts error:", error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }

  async function handleDistrictClick(district: District) {
    setSelectedDistrict(district);
    setNeighborhoods([]);
    setLoadingNeighborhoods(true);

    try {
      const response = await fetch(
        `/api/locations/neighborhoods?districtId=${district.id}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Mahalleler alınamadı");
      }

      const data = await response.json();

      const result: Neighborhood[] = Array.isArray(data)
        ? data
        : data.neighborhoods ?? [];

      setNeighborhoods(result);
    } catch (error) {
      console.error("Neighborhoods error:", error);
      setNeighborhoods([]);
    } finally {
      setLoadingNeighborhoods(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Türkiye Haritası
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Haritadan ilinizi seçin.
        </p>

        {selectedProvince && (
          <div className="mt-3 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            {selectedProvince.name}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-slate-50 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Türkiye il haritası"
        >
          {features.map((feature) => {
            const province = provinces.find(
              (item) => item.code === feature.code
            );

            if (!province) return null;

            const geoFeature = {
              type: "Feature" as const,
              properties: {
                code: feature.code,
              },
              geometry: feature.geometry as any,
            };

            const d = pathGenerator(geoFeature as any);

            const centroid =
              pathGenerator.centroid(
                geoFeature as any
              );

            if (!d) return null;

            const selected =
              selectedProvince?.id === province.id;

            return (
              <g key={feature.id}>
                <path
                  d={d}
                  onClick={() =>
                    handleProvinceClick(feature.code)
                  }
                  className={
                    selected
                      ? "fill-blue-600 stroke-blue-900 cursor-pointer"
                      : "fill-blue-100 stroke-blue-600 hover:fill-blue-400 cursor-pointer"
                  }
                  strokeWidth={selected ? 2 : 1}
                  vectorEffect="non-scaling-stroke"
                />

                {Number.isFinite(centroid[0]) &&
                  Number.isFinite(centroid[1]) && (
                    <text
                      x={centroid[0]}
                      y={centroid[1]}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none select-none fill-slate-800 text-[11px] font-bold"
                      style={{
                        paintOrder: "stroke",
                        stroke: "white",
                        strokeWidth: 3,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                      }}
                    >
                      {province.name}
                    </text>
                  )}

                <title>{province.name}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex justify-between text-xs text-slate-500">
        <span>{features.length} il</span>

        <span>
          81 il • Gerçek GeoJSON sınırları
        </span>
      </div>

      {selectedProvince && (
        <div className="mt-6 rounded-2xl border bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedProvince.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                İlçe seçin
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedProvince(null);
                setDistricts([]);
              }}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Kapat
            </button>
          </div>

          {loadingDistricts ? (
            <div className="mt-5 rounded-xl bg-white p-4 text-sm text-slate-500">
              İlçeler yükleniyor...
            </div>
          ) : districts.length === 0 ? (
            <div className="mt-5 rounded-xl bg-white p-4 text-sm text-red-600">
              Bu il için ilçe bulunamadı.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {districts.map((district) => (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => handleDistrictClick(district)}
                  className={
                    selectedDistrict?.id === district.id
                      ? "rounded-xl border border-blue-600 bg-blue-50 px-3 py-3 text-left text-sm font-bold text-blue-700"
                      : "rounded-xl border bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                  }
                >
                  {district.name}
                </button>
              ))}
            </div>
          )}

          {selectedDistrict && (
            <div className="mt-6 border-t pt-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedDistrict.name}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Mahalle seçin
                </p>
              </div>

              {loadingNeighborhoods ? (
                <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-500">
                  Mahalleler yükleniyor...
                </div>
              ) : neighborhoods.length === 0 ? (
                <div className="mt-4 rounded-xl bg-white p-4 text-sm text-red-600">
                  Bu ilçe için mahalle bulunamadı.
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {neighborhoods.map((neighborhood) => (
                    <button
                      key={neighborhood.id}
                      type="button"
                      className="rounded-xl border bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {neighborhood.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
