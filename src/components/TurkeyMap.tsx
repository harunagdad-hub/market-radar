"use client";

import { MapContainer, TileLayer } from "react-leaflet";

export default function TurkeyMap() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
      <MapContainer
        center={[39, 35]}
        zoom={6}
        scrollWheelZoom
        className="h-[600px] w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
}
