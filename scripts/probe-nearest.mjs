import { writeFileSync } from "node:fs";

const BASE = "https://api.marketfiyati.org.tr/api/v2";
const body = { latitude: 39.9334, longitude: 32.8597, distance: 5 };

for (const path of ["/nearest", "/nearest-depots", "/depots/nearest"]) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(path, "-> HTTP", res.status);
  if (res.ok) {
    try {
      const json = JSON.parse(text);
      writeFileSync("data/samples/marketfiyati-nearest.json", JSON.stringify(json, null, 2));
      console.log(JSON.stringify(json, null, 2).slice(0, 3000));
    } catch {
      console.log(text.slice(0, 1500));
    }
    break;
  } else {
    console.log(text.slice(0, 300));
  }
}
