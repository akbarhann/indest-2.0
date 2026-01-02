import time
import sys
import os

# Ensure backend module is found
sys.path.append(os.getcwd())

from sqlmodel import Session, select
from backend.database import get_session, engine
from backend.models import Village, AIAnalysis
from backend.services.ai_service import generate_village_insights

def batch_generate_ai():
    with Session(engine) as session:
        # Fetch all villages
        villages = session.exec(select(Village)).all()
        total = len(villages)
        print(f"Starting batch AI generation for {total} villages...")

        for index, village in enumerate(villages):
            print(f"[{index+1}/{total}] Processing {village.name} ({village.id})...")
            
            # Prepare data for AI
            village_data = {
                "name": village.name,
                "district": village.district,
                "topography": village.topography,
                "primary_income": village.economy.primary_income if village.economy else "Unknown",
                "health_status": "High Risk" if village.health and (village.health.dengue_cases > 0 or village.health.malnutrition_cases > 0) else "Safe", # Simplified
                "education_level": "High" if village.education and village.education.universities > 0 else "Standard",
                "digital_access": village.digital.signal_strength if village.digital else "None"
            }

            try:
                # Call Gemini API
                insights = generate_village_insights(village_data)
                
                # Check if we got valid unique data (not fallback)
                if insights.get("persona") == "Unknown" or insights.get("local_hero") == "Analysis failed.":
                     print(f"  -> Failed to get valid AI response for {village.name}. Retrying or skipping.")
                     # Optional: Retry logic could go here
                
                # Update/Create Analysis Record
                if not village.ai_analysis:
                    analysis = AIAnalysis(
                        village_id=village.id,
                        persona=insights.get("persona", "Unknown"),
                        social_capital_narrative=insights.get("local_hero", ""),
                        swot_analysis=insights.get("swot", {}),
                        recommendations=insights.get("recommendations", {})
                    )
                    session.add(analysis)
                else:
                    aa = village.ai_analysis
                    aa.persona = insights.get("persona", "Unknown")
                    aa.social_capital_narrative = insights.get("local_hero", "")
                    aa.swot_analysis = insights.get("swot", {})
                    aa.recommendations = insights.get("recommendations", {})
                    session.add(aa)
                
                session.commit()
                print(f"  -> Success!")
                
                # Sleep to respect rate limits (e.g. 15 requests/min for free tier?)
                # Let's be safe with 4 seconds
                time.sleep(4) 

            except Exception as e:
                print(f"  -> Error: {e}")
                session.rollback()

if __name__ == "__main__":
    batch_generate_ai()
