import json
import os
import time
import requests
from bs4 import BeautifulSoup

BASE = "https://www.bim.com.tr/Categories/104/magazalar.aspx"
OUTPUT = "data/bim-stores.json"

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (MarketRadar/1.0)"
})

def clean(text):
    return " ".join(text.split())

def get_page(url):
    response = session.get(url, timeout=30)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")

os.makedirs("data", exist_ok=True)

print("BİM Türkiye mağaza taraması başlıyor...\n")

# 81 ili bul
soup = get_page(BASE)

city_select = soup.select_one("#BimFiltre_DrpCity")

cities = [
    (option.get("value"), clean(option.get_text(" ", strip=True)))
    for option in city_select.select("option")
    if option.get("value") != "0"
]

print(f"Bulunan il sayısı: {len(cities)}\n")

all_stores = []
seen = set()

for city_index, (city_code, city_name) in enumerate(cities, 1):

    print(f"[{city_index}/{len(cities)}] {city_name}")

    # İlin ilçelerini al
    try:
        city_soup = get_page(f"{BASE}?CityKey={city_code}")
    except Exception as e:
        print(f"  İL HATASI: {e}")
        continue

    county_select = city_soup.select_one("#BimFiltre_DrpCounty")

    if not county_select:
        print("  İlçe listesi bulunamadı.")
        continue

    districts = [
        (option.get("value"), clean(option.get_text(" ", strip=True)))
        for option in county_select.select("option")
        if option.get("value") != "0"
    ]

    print(f"  İlçe: {len(districts)}")

    for district_index, (county_code, district_name) in enumerate(districts, 1):

        try:
            url = f"{BASE}?CityKey={city_code}&CountyKey={county_code}"
            district_soup = get_page(url)

            stores = district_soup.select(".boxArea .box")

            district_count = 0

            for box in stores:
                title = box.select_one("h3.title")
                address = box.select_one("p")

                if not title or not address:
                    continue

                name = clean(title.get_text(" ", strip=True))
                addr = clean(address.get_text(" ", strip=True))

                key = (
                    city_name.lower(),
                    district_name.lower(),
                    name.lower(),
                    addr.lower(),
                )

                if key in seen:
                    continue

                seen.add(key)

                all_stores.append({
                    "chain": "BİM",
                    "name": name,
                    "address": addr,
                    "city": city_name,
                    "district": district_name,
                    "cityCode": int(city_code),
                    "districtCode": int(county_code),
                    "source": "BIM",
                })

                district_count += 1

            if district_count:
                print(f"    {district_name}: {district_count}")

            # BİM sunucusuna aşırı yük bindirmemek için
            time.sleep(0.25)

        except Exception as e:
            print(f"    HATA {district_name}: {e}")

    print(f"  Şimdiye kadar toplam mağaza: {len(all_stores)}\n")

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(all_stores, f, ensure_ascii=False, indent=2)

print("=" * 60)
print("TARAMA TAMAMLANDI")
print(f"Toplam gerçek BİM mağazası: {len(all_stores)}")
print(f"Dosya: {OUTPUT}")
print("=" * 60)
