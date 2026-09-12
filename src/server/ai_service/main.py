"""
================================================================================
🏛️ «ШЫМКЕНТ СВАЙП» — ИИ-МИКРОСЕРВИС КЛАСТЕРИЗАЦИИ И ПРИОРИТИЗАЦИИ (Python / FastAPI)
================================================================================
Функционал:
1. Гео-поиск дубликатов в радиусе 30 метров за последние 48 часов (Haversine formula).
2. Rule-based и NLP анализ ключевых слов для автоматического присвоения индекса срочности (1-10).
3. Кластеризация похожих жалоб горожан для объединения счетчиков и предотвращения спама в ЕКЦ 109.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import math
from datetime import datetime, timedelta

app = FastAPI(
    title="Shymkent Smart City AI Cluster & Priority Service",
    description="Микросервис детекции дубликатов в радиусе 30м и приоритизации жалоб горожан Шымкента для ЕКЦ 109",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Pydantic Модели
# -----------------------------------------------------------------------------
class IncidentItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    created_at: datetime
    criticality_index: float = 5.0
    swipes_right: int = 0

class CheckDuplicateRequest(BaseModel):
    title: str = Field(..., example="Порыв трубы с горячей водой на пр. Тауке Хана")
    description: str = Field(..., example="Вода заливает проезжую часть, пар идет из люка")
    category: str = Field(..., example="ZHKH")
    latitude: float = Field(..., example=42.3195)
    longitude: float = Field(..., example=69.5932)
    created_at: Optional[datetime] = None

class PrioritizeRequest(BaseModel):
    text: str = Field(..., example="Открыт глубокий люк прямо возле детского сада, дети могут упасть!")
    category: str = Field(..., example="SAFETY")

class AnalysisResponse(BaseModel):
    is_duplicate: bool
    duplicate_incident_id: Optional[str] = None
    distance_meters: Optional[float] = None
    urgency_index: int = Field(..., ge=1, le=10, description="Индекс срочности от 1 до 10")
    detected_keywords: List[str]
    escalate_to_109: bool
    recommended_action: str

# -----------------------------------------------------------------------------
# База знаний критических ключевых слов для Шымкента (Rule-based NLP)
# -----------------------------------------------------------------------------
CRITICAL_KEYWORDS_URGENCY_10 = [
    "запах газа", "утечка газа", "газ иісі", "открытый люк", "ашық люк",
    "провал грунта", "обвал дороги", "оголенный провод", "искрит провод",
    "обрушение", "угроза жизни", "фонтан кипятка", "топит подстанцию"
]

CRITICAL_KEYWORDS_URGENCY_9 = [
    "прорыв трубы", "құбыр жарылды", "нет воды во всем районе", "нет света",
    "светофор не работает", "бағдаршам істемейді", "дети могут упасть",
    "размыло асфальт", "сорвало крышу", "упало дерево на машину"
]

HIGH_KEYWORDS_URGENCY_7_8 = [
    "глубокая яма", "үлкен шұңқыр", "стихийная свалка", "засор канализации",
    "кәріз бітелді", "нет уличного освещения", "жарық жоқ", "разбита остановка",
    "не убран мусор", "қоқыс шығарылмаған", "порыв водопровода"
]

MEDIUM_KEYWORDS_URGENCY_4_6 = [
    "трещина в асфальте", "стерта разметка", "сломана скамейка", "урна переполнена",
    "не скошена трава", "граффити", "нет пандуса", "бордюр сломан"
]

# Имитация активных инцидентов за последние 48 часов в Шымкенте
ACTIVE_INCIDENTS_DB: List[IncidentItem] = [
    IncidentItem(
        id="rep-shym-001",
        title="Порыв магистрального водопровода возле ТЦ Shymkent Plaza",
        description="Сильная утечка воды на проезжей части по пр. Тауке Хана",
        category="ZHKH",
        latitude=42.3195,
        longitude=69.5932,
        created_at=datetime.utcnow() - timedelta(hours=3),
        criticality_index=9.2,
        swipes_right=42
    ),
    IncidentItem(
        id="rep-shym-002",
        title="Открытый колодец возле школы №65 в мкр. Нурсат",
        description="Отсутствует чугунная крышка люка на тротуаре",
        category="SAFETY",
        latitude=42.3688,
        longitude=69.6284,
        created_at=datetime.utcnow() - timedelta(hours=8),
        criticality_index=9.8,
        swipes_right=67
    ),
]

# -----------------------------------------------------------------------------
# Гео-утилиты (Haversine Distance в метрах)
# -----------------------------------------------------------------------------
def calculate_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Радиус Земли в метрах
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

# -----------------------------------------------------------------------------
# NLP Анализ срочности по ключевым словам
# -----------------------------------------------------------------------------
def evaluate_urgency(text: str, category: str) -> tuple[int, List[str]]:
    lowered = text.lower()
    matched_keywords = []

    # 10 баллов - ЧС и угроза жизни
    for kw in CRITICAL_KEYWORDS_URGENCY_10:
        if kw in lowered:
            matched_keywords.append(kw)
    if matched_keywords:
        return 10, matched_keywords

    # 9 баллов - Крупные аварии
    for kw in CRITICAL_KEYWORDS_URGENCY_9:
        if kw in lowered:
            matched_keywords.append(kw)
    if matched_keywords:
        return 9, matched_keywords

    # 7-8 баллов - Высокая важность
    for kw in HIGH_KEYWORDS_URGENCY_7_8:
        if kw in lowered:
            matched_keywords.append(kw)
    if matched_keywords:
        return 8, matched_keywords

    # 4-6 баллов - Средняя срочность
    for kw in MEDIUM_KEYWORDS_URGENCY_4_6:
        if kw in lowered:
            matched_keywords.append(kw)
    if matched_keywords:
        return 5, matched_keywords

    # Базовая срочность по категории
    base_urgency = {
        "SAFETY": 7,
        "ZHKH": 6,
        "ROADS": 5,
        "TRANSPORT": 5,
        "ECOLOGY": 4,
        "LANDSCAPING": 3,
        "ACCESSIBILITY": 4,
    }.get(category, 4)

    return base_urgency, matched_keywords

# -----------------------------------------------------------------------------
# Эндпоинты FastAPI
# -----------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Shymkent AI Clustering & Prioritization",
        "timestamp": datetime.utcnow().isoformat(),
        "active_incidents_in_cache": len(ACTIVE_INCIDENTS_DB)
    }

@app.post("/api/v1/analyze-complaint", response_model=AnalysisResponse)
def analyze_complaint(req: CheckDuplicateRequest):
    """
    1. Проверяет в радиусе 30 метров наличие похожей жалобы за 48 часов.
    2. Вычисляет индекс срочности (1-10) на основе анализа ключевых слов.
    3. Принимает решение об эскалации в ЕКЦ 109.
    """
    full_text = f"{req.title} {req.description}"
    urgency, keywords = evaluate_urgency(full_text, req.category)

    now = datetime.utcnow()
    two_days_ago = now - timedelta(hours=48)

    duplicate_id = None
    min_dist = None
    is_dup = False

    # Поиск дубликатов в радиусе 30 метров
    for inc in ACTIVE_INCIDENTS_DB:
        if inc.created_at >= two_days_ago and inc.category == req.category:
            dist = calculate_distance_meters(req.latitude, req.longitude, inc.latitude, inc.longitude)
            if dist <= 30.0:
                is_dup = True
                duplicate_id = inc.id
                min_dist = dist
                # Увеличиваем счетчик у существующего инцидента
                inc.swipes_right += 1
                break

    escalate = urgency >= 8 or is_dup

    if is_dup:
        rec_action = f"Объединить со существующей заявкой #{duplicate_id}. Голос добавлен к счетчику важности."
    elif urgency >= 9:
        rec_action = "КРИТИЧЕСКИЙ ПРИОРИТЕТ: Мгновенная передача в ЕКЦ 109 и отправка аварийной бригады."
    elif urgency >= 7:
        rec_action = "ВЫСОКИЙ ПРИОРИТЕТ: Поместить в топ гео-ленты свайпов района."
    else:
        rec_action = "ШТАТНЫЙ РЕЖИМ: Стандартное голосование горожан в приложении."

    return AnalysisResponse(
        is_duplicate=is_dup,
        duplicate_incident_id=duplicate_id,
        distance_meters=min_dist,
        urgency_index=urgency,
        detected_keywords=keywords,
        escalate_to_109=escalate,
        recommended_action=rec_action
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
