import { writeFileSync } from "node:fs";

const BASE = "https://api.marketfiyati.org.tr/api/v2";
const body = {
  keywords: process.argv[2] || "süt",
  pages: 0,
  size: 5,
  latitude: 39.9334,   // Ankara merkez
  longitude: 32.8597,
  distance: 5,
};

const res = await fetch(`${BASE}/search`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log("HTTP", res.status);
try {
  const json = JSON.parse(text);
  writeFileSync("data/samples/marketfiyati-search.json", JSON.stringify(json, null, 2));
  console.log(JSON.stringify(json, null, 2).slice(0, 3500));
} catch {
  console.log(text.slice(0, 1500));
}
