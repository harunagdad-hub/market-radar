import MarketGlobe from "../src/components/MarketGlobe";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-400">
              Market Radar
            </h1>
            <p className="text-sm text-slate-400">
              Türkiye genelinde gerçek marketleri keşfet
            </p>
          </div>

          <button
            type="button"
            className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
          >
            📍 Konumumu Kullan
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Dünyadan marketlere ulaş
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Türkiye'yi seç, istediğin bölgeye yaklaş ve çevrendeki gerçek
            marketleri keşfet.
          </p>
        </div>

        <MarketGlobe />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl">🌍</div>
            <h3 className="mt-3 font-bold">Türkiye'yi seç</h3>
            <p className="mt-1 text-sm text-slate-400">
              Harita üzerinden istediğin bölgeye yaklaş.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl">📍</div>
            <h3 className="mt-3 font-bold">Konum seç</h3>
            <p className="mt-1 text-sm text-slate-400">
              İstediğin noktayı harita üzerinde belirle.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl">🛒</div>
            <h3 className="mt-3 font-bold">Marketleri gör</h3>
            <p className="mt-1 text-sm text-slate-400">
              Yakındaki gerçek market şubelerini karşılaştır.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
