from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from backend.database import get_session
from backend.models import Village, AIAnalysis
from backend.schemas import MacroResponse, MicroResponse, VillageMacro, VillageMicro, HealthRadar, EducationFunnel, IndependenceIndex, AIInsights, AISwot
from backend.services.analytics import ScoringAlgorithm
from backend.services.geofencing import geofence_service
from sqlalchemy.orm import selectinload
import time
import math

app = FastAPI(title="Village Intelligence Dashboard API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev; specify ["http://localhost:5173"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Village Intelligence Dashboard API is running"}

# Simple In-Memory Cache
MACRO_CACHE = {"data": None, "expiry": 0}
BOUNDARIES_CACHE = None
CACHE_DURATION = 300  # 5 minutes

@app.get("/api/boundaries")
def get_boundaries():
    """
    Get GeoJSON boundaries for all villages.
    Cached in memory for performance.
    """
    global BOUNDARIES_CACHE
    if BOUNDARIES_CACHE:
        return BOUNDARIES_CACHE

    import os
    import json
    file_path = os.path.join(os.getcwd(), "data", "peta_desa_202513524.geojson")
    if not os.path.exists(file_path):
         file_path = os.path.join(os.getcwd(), "..", "data", "peta_desa_202513524.geojson")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
        
    with open(file_path, "r", encoding="utf-8") as f:
        BOUNDARIES_CACHE = json.load(f)
        return BOUNDARIES_CACHE

@app.get("/api/macro", response_model=MacroResponse)
def get_macro_data(session: Session = Depends(get_session)):
    """
    Get aggregated data for Regional Macro View.
    Cached for 5 minutes to improve performance on large datasets.
    """
    current_time = time.time()
    
    # Check Cache
    if MACRO_CACHE["data"] and current_time < MACRO_CACHE["expiry"]:
        return MACRO_CACHE["data"]

    
    # Eager load all relationships to prevent N+1 queries during iteration
    query = select(Village).options(
        selectinload(Village.health),
        selectinload(Village.education),
        selectinload(Village.economy),
        selectinload(Village.infrastructure),
        selectinload(Village.digital),
        selectinload(Village.disaster),
        selectinload(Village.disease),
        selectinload(Village.criminal)
    )
    villages = session.exec(query).all()
    results = []
    
    for v in villages:
        # Calculate on fly (could be cached)
        health = ScoringAlgorithm.calculate_health_radar(v)
        edu = ScoringAlgorithm.calculate_education_funnel(v)
        
        results.append(VillageMacro(
            id=v.id,
            name=v.name,
            district=v.district,
            latitude=float(v.latitude) if v.latitude is not None else 0.0,
            longitude=float(v.longitude) if v.longitude is not None else 0.0,
            health_radar=HealthRadar(**health),
            education_funnel=EducationFunnel(**edu),
            economy=v.economy,
            infrastructure=v.infrastructure,
            digital=v.digital,
            disaster=v.disaster,
            disease=v.disease,
            criminal=v.criminal
        ))
        
    response = MacroResponse(data=results)
    
    # Update Cache
    MACRO_CACHE["data"] = response
    MACRO_CACHE["expiry"] = current_time + CACHE_DURATION
    
    return response

@app.get("/api/micro/{village_id}", response_model=MicroResponse)
def get_micro_data(village_id: str, session: Session = Depends(get_session)):
    """
    Get detailed profile for a specific village, including AI Insights.
    """
    village = session.get(Village, village_id)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
        
    # Analytics
    health = ScoringAlgorithm.calculate_health_radar(village)
    edu = ScoringAlgorithm.calculate_education_funnel(village)
    index = ScoringAlgorithm.calculate_independence_index(village)
    
    # AI Data
    ai_data = None
    if village.ai_analysis:
        aa = village.ai_analysis
        # Handle potential None or empty JSONB
        swot_raw = aa.swot_analysis or {}
        # Ensure strict typing
        swot = AISwot(
            strengths=swot_raw.get("strengths", []),
            weaknesses=swot_raw.get("weaknesses", []),
            opportunities=swot_raw.get("opportunities", []),
            threats=swot_raw.get("threats", [])
        )
        
        ai_data = AIInsights(
            swot=swot,
            persona=aa.persona or "Unknown",
            local_hero=aa.social_capital_narrative or "",
            recommendations=aa.recommendations.get("recommendations", []) if aa.recommendations else []
        )

    # Construct Response
    return MicroResponse(data=VillageMicro(
        id=village.id,
        name=village.name,
        district=village.district,
        status=village.status,
        topography=village.topography,
        forest_location=village.forest_location,
        latitude=float(village.latitude),
        longitude=float(village.longitude),
        demographics={
            # Placeholders or mapped from columns not yet strictly defined 
            # In real app, map these from population columns if they exist
            "population": "N/A" 
        },
        stats={
            # Use new columns 'jumlah_dokter' (was doctors)
            "doctors": village.health.jumlah_dokter if village.health else 0,
            "schools": village.education.sd_counts if village.education else 0,
            "markets": village.economy.markets if village.economy else 0,
            "signal": village.digital.signal_strength if village.digital else "Unknown"
        },
        analytics={
            "health_radar": health,
            "education_funnel": edu,
            "independence_index": index
        },
        ai_insights=ai_data,
        
        # Populate nested models
        health=village.health,
        education=village.education,
        economy=village.economy,
        infrastructure=village.infrastructure,
        digital=village.digital,
        disaster=village.disaster,
        disease=village.disease,
        criminal=village.criminal,
        social=village.social,
        security=village.security,
        sanitasi=village.sanitasi
    ))

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    d = R * c
    return d

@app.get("/api/nearest-village")
def get_nearest_village(lat: float, long: float, session: Session = Depends(get_session)):
    """
    Find the village for a given coordinate. 
    Uses High-Accuracy Polygon lookup (Geofencing) first, 
    falls back to Haversine (Nearest Centroid) if outside all polygons.
    """
    # 1. High-Accuracy Polygon Lookup
    print(f"DEBUG: Geofence lookup for {lat}, {long}")
    geofence_match = geofence_service.find_village(lat, long)
    if geofence_match:
        print(f"DEBUG: Geofence HIT: {geofence_match['name']} ({geofence_match['id']})")
        return {
            "id": geofence_match["id"],
            "name": geofence_match["name"],
            "distance_km": 0,
            "method": "geofence"
        }
    
    # 2. Fuzzy Polygon Lookup (Near the border? ~500m)
    print("DEBUG: Geofence MISS. Trying fuzzy polygon match...")
    fuzzy_match = geofence_service.find_nearest_polygon(lat, long)
    if fuzzy_match:
        print(f"DEBUG: Fuzzy HIT: {fuzzy_match['name']} (~{fuzzy_match['distance_approx_m']}m)")
        return {
            "id": fuzzy_match["id"],
            "name": fuzzy_match["name"],
            "distance_km": float(fuzzy_match['distance_approx_m'] / 1000),
            "method": "geofence_fuzzy"
        }

    print("DEBUG: Fuzzy MISS. Falling back to Haversine Centroid.")

    # 3. Fallback to Nearest Centroid (Haversine)
    query = select(Village)
    villages = session.exec(query).all()
    
    if not villages:
        raise HTTPException(status_code=404, detail="No villages found")

    nearest_village = None
    min_dist = float('inf')

    for v in villages:
        try:
            dist = haversine(lat, long, float(v.latitude), float(v.longitude))
            if dist < min_dist:
                min_dist = dist
                nearest_village = v
        except Exception:
            continue
            
    if not nearest_village:
        return {"id": "3524012015", "name": "Kemlagi Lor (Fallback)", "distance_km": 0, "method": "error_fallback"}

    return {
        "id": nearest_village.id, 
        "name": nearest_village.name, 
        "distance_km": round(min_dist, 2),
        "method": "haversine_fallback"
    }
