from sqlmodel import Session, select
from backend.database import engine
from backend.models import Village, AIAnalysis
from backend.services.analytics import ScoringAlgorithm

def get_village_data_for_ai(village_id: str):
    """
    Fetches comprehensive data for a village to be used for AI analysis.
    """
    with Session(engine) as session:
        statement = select(Village).where(Village.id == village_id)
        village = session.exec(statement).first()
        
        if not village:
            return None
        
        # Ensure relations are loaded (lazy loading might require access or explicit join)
        # Accessing them here triggers the load if within session
        data = {
            "name": village.name,
            "district": village.district,
            "topography": village.topography,
            "forest": village.forest_location,
            "status": village.status,
            "demographics": {
                "health": ScoringAlgorithm.calculate_health_radar(village),
                "education": ScoringAlgorithm.calculate_education_funnel(village),
                "economy": ScoringAlgorithm.calculate_independence_index(village)
            },
            "raw_stats": {
                "products": village.economy.primary_income if village.economy else "Unknown",
                "markets": village.economy.markets if village.economy else 0,
                "internet": village.digital.internet_availability if village.digital else "Unknown",
                "signal": village.digital.signal_strength if village.digital else "Unknown",
                "disaster_history": {
                   "flood": village.disaster.flood_cases if village.disaster else 0,
                   "landslide": village.disaster.landslide_cases if village.disaster else 0
                }
            }
        }
        return data

def save_ai_insights(village_id: str, insights: dict):
    """
    Saves or updates the AI insights for a village.
    """
    with Session(engine) as session:
        # Check if analysis exists
        statement = select(AIAnalysis).where(AIAnalysis.village_id == village_id)
        analysis = session.exec(statement).first()
        
        if not analysis:
            analysis = AIAnalysis(village_id=village_id)
        
        # Update fields
        if "swot" in insights:
            analysis.swot_analysis = insights["swot"]
        if "persona" in insights:
            analysis.persona = insights["persona"]
        if "recommendations" in insights:
            analysis.recommendations = insights.get("recommendations", {}) # Optional in requirement but good to have
        if "local_hero" in insights:
            analysis.social_capital_narrative = insights["local_hero"]
            
        session.add(analysis)
        session.commit()
        session.refresh(analysis)
        return analysis
