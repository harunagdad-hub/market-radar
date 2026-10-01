import dynamic from "next/dynamic";

const TurkeyMap = dynamic(() => import("../components/TurkeyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-3xl bg-white shadow">
      Harita hazırlanıyor...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-700">
              Market Radar
            </h1>
            <p className="text-sm text-slate-500">
              Türkiye market fiyat karşılaştırma sistemi
            </p>
          </div>

          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            81 İl
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-slate-900">
            Marketleri bulunduğun bölgeden keşfet
          </h2>
          <p className="mt-2 text-slate-600">
            Türkiye haritasından ilini seç, ardından ilçe ve mahalledeki
            marketleri görüntüle.
          </p>
        </div>

        <TurkeyMap />
      </section>
    </main>
  );
}
