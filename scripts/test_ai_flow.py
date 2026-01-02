import sys
import os
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.db_service import get_village_data_for_ai, save_ai_insights
from backend.services.ai_service import generate_village_insights
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Village

def main():
    print("Starting AI Flow Verification...")
    
    # 1. Fetch a random village ID
    with Session(engine) as session:
        village = session.exec(select(Village)).first()
        if not village:
            print("No villages found in database. Run migration first.")
            return
        village_id = village.id
        print(f"Targeting Village ID: {village_id} ({village.name})")

    # 2. Get Data
    print("Fetching village data...")
    village_data = get_village_data_for_ai(village_id)
    if not village_data:
        print("Failed to fetch village data.")
        return
    
    print("Data fetched successfully.")
    # print(json.dumps(village_data, indent=2)) # Debug

    # 3. Generate AI Insights
    print("Generating insights with Gemini...")
    insights = generate_village_insights(village_data)
    
    print("\n--- AI Output ---")
    print(json.dumps(insights, indent=2))
    print("-----------------\n")

    # 4. Save to DB
    print("Saving to database...")
    saved_analysis = save_ai_insights(village_id, insights)
    
    if saved_analysis:
        print(f"Success! Insights saved for Village {village_id}.")
        print(f"Persona: {saved_analysis.persona}")
    else:
        print("Failed to save analysis.")

if __name__ == "__main__":
    main()
