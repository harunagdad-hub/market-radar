"use client";

import { useEffect, useRef } from "react";

export default function MarketGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let globe: any;

    async function loadGlobe() {
      if (!containerRef.current) return;

      console.log("MARKET GLOBE: başlıyor");

      const [{ default: Globe }, THREE] = await Promise.all([
        import("react-globe.gl"),
        import("three"),
      ]);

      if (!containerRef.current) return;

      console.log("MARKET GLOBE: paketler yüklendi");

      globe = new Globe(containerRef.current)
        .globeImageUrl(
          "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        )
        .bumpImageUrl(
          "//unpkg.com/three-globe/example/img/earth-topology.png"
        )
        .backgroundImageUrl(
          "//unpkg.com/three-globe/example/img/night-sky.png"
        )
        .atmosphereColor("#60a5fa")
        .atmosphereAltitude(0.18);

      console.log("MARKET GLOBE: küre oluşturuldu");

      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.35;
      globe.controls().enableZoom = true;

      const camera = globe.camera();
      camera.position.z = 260;

      const renderer = globe.renderer();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      void THREE;
    }

    loadGlobe();

    return () => {
      if (globe) {
        globe._destructor?.();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[620px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
    />
  );
}
