#!/usr/bin/env python3
"""
==============================================================================
🏙️ SHYMKENT SMART CITY — SYNTHETIC DATA GENERATION SCRIPT (Python / PostgreSQL / CSV)
==============================================================================
Генерирует 50+ реалистичных инцидентов инфраструктуры Шымкента для демонстрации
жюри хакатона.

Запуск: python3 scripts/generate_synthetic_data.py
"""

import json
import random
from datetime import datetime, timedelta

DISTRICTS = ["AL_FARABI", "KARATAU", "ENBEKSHI", "ABAY", "TURAN"]
CATEGORIES = ["ROADS", "ZHKH", "SAFETY", "ECOLOGY", "TRANSPORT", "LANDSCAPING", "ACCESSIBILITY"]

SAMPLE_PROBLEMS = [
    {"title": "Порыв водопровода на пр. Тауке Хана", "cat": "ZHKH", "dist": "AL_FARABI", "lat": 42.3195, "lon": 69.5932, "addr": "пр. Тауке хана 14", "crit": 9.4},
    {"title": "Глубокая яма у перекрестка Кунаева / Туркестанская", "cat": "ROADS", "dist": "AL_FARABI", "lat": 42.3168, "lon": 69.5975, "addr": "пр. Кунаева / ул. Туркестан", "crit": 8.7},
    {"title": "Открытый чугунный люк у школы №65 в Нурсате", "cat": "SAFETY", "dist": "KARATAU", "lat": 42.3688, "lon": 69.6284, "addr": "мкр. Нурсат, ул. Байтерекова 24", "crit": 9.9},
    {"title": "Сброс промышленных отходов в арык по ул. Капал Батыра", "cat": "ECOLOGY", "dist": "ENBEKSHI", "lat": 42.2891, "lon": 69.6455, "addr": "ул. Капал батыра 88", "crit": 9.7},
    {"title": "Загрязнение водоохранной полосы реки Бадам", "cat": "ECOLOGY", "dist": "ABAY", "lat": 42.3045, "lon": 69.5741, "addr": "прибрежная зона реки Бадам", "crit": 9.0},
    {"title": "Отсутствие освещения на бульваре Шымкент-Сити", "cat": "SAFETY", "dist": "TURAN", "lat": 42.3512, "lon": 69.5388, "addr": "мкр. Шымкент-Сити", "crit": 8.9},
    {"title": "Запах газа возле ГРП в пос. Чапаевка", "cat": "SAFETY", "dist": "ENBEKSHI", "lat": 42.2755, "lon": 69.6588, "addr": "мкр. Шапагат, ул. Сейфуллина", "crit": 10.0},
    {"title": "Провал дорожного полотна по Темирланскому шоссе", "cat": "ROADS", "dist": "ABAY", "lat": 42.3288, "lon": 69.5499, "addr": "Темирланское шоссе 45", "crit": 8.9},
    {"title": "Порыв теплотрассы у детской больницы", "cat": "ZHKH", "dist": "KARATAU", "lat": 42.3712, "lon": 69.6234, "addr": "пр. Астана 84, мкр. Нурсат", "crit": 9.3},
    {"title": "Провал асфальта у новостройки ЖК Туран Палас", "cat": "ROADS", "dist": "TURAN", "lat": 42.3489, "lon": 69.5412, "addr": "мкр. Туран, ул. Жанакурылыс 12", "crit": 9.2},
]

def generate_50_synthetic_records():
    records = []
    base_time = datetime.utcnow()

    for i in range(50):
        template = SAMPLE_PROBLEMS[i % len(SAMPLE_PROBLEMS)]
        lat_offset = (random.random() - 0.5) * 0.015
        lon_offset = (random.random() - 0.5) * 0.015
        
        swipes_r = random.randint(30, 180)
        swipes_l = random.randint(2, 20)
        swipes_u = random.randint(5, 45)
        
        record = {
            "id": f"rep-shym-py-{i+1:03d}",
            "title": f"{template['title']} (Точка #{i+1})",
            "description": f"Автоматически сгенерированный инцидент инфраструктуры для стресс-тестирования ЕКЦ 109 и алгоритмов гео-кластеризации.",
            "category": template["cat"],
            "district": template["dist"],
            "latitude": round(template["lat"] + lat_offset, 6),
            "longitude": round(template["lon"] + lon_offset, 6),
            "address": f"{template['addr']}, ориентир #{i+1}",
            "criticality_index": template["crit"],
            "swipe_right_count": swipes_r,
            "swipe_left_count": swipes_l,
            "swipe_up_count": swipes_u,
            "total_views": swipes_r + swipes_l + swipes_u + random.randint(10, 50),
            "status": "SENT_TO_109" if template["crit"] >= 8.5 else "IN_PROGRESS" if template["crit"] >= 7.0 else "NEW",
            "created_at": (base_time - timedelta(hours=i * 2.5)).isoformat() + "Z"
        }
        records.append(record)

    with open("shymkent_synthetic_data_50.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"✅ Успешно сгенерировано {len(records)} записей в shymkent_synthetic_data_50.json")

if __name__ == "__main__":
    generate_50_synthetic_records()
