import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add parent dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import Village, AIAnalysis

async def init_db_script():
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv("MONGODB_DB_NAME", "indest_db")
    db = client[db_name]
    await init_beanie(database=db, document_models=[Village])

async def populate_all_demo_data():
    await init_db_script()

    # 1. Get the High Quality Demo Data from our template village
    template_id = "3524010001" 
    template_village = await Village.get(template_id)
    
    if not template_village or not template_village.ai_analysis or not template_village.ai_analysis.persona:
        print("Template data missing or invalid! Run inject_demo_data.py first.")
        return

    demo_analysis = template_village.ai_analysis

    # 2. Get all villages
    villages = await Village.find_all().to_list()
    count = 0
    
    for v in villages:
        if v.id == template_id:
            continue

        changed = False
        # Create new if missing
        if not v.ai_analysis:
            v.ai_analysis = AIAnalysis(
                persona=demo_analysis.persona,
                social_capital_narrative=demo_analysis.social_capital_narrative,
                swot_analysis=demo_analysis.swot_analysis,
                recommendations=demo_analysis.recommendations
            )
            changed = True
        else:
            # Update if empty/unknown
            aa = v.ai_analysis
            if not aa.persona or aa.persona == "Unknown":
                aa.persona = demo_analysis.persona
                aa.social_capital_narrative = demo_analysis.social_capital_narrative
                aa.swot_analysis = demo_analysis.swot_analysis
                aa.recommendations = demo_analysis.recommendations
                changed = True
        
        if changed:
            await v.save()
            count += 1
    
    print(f"Successfully populated demo AI data for {count} villages.")

if __name__ == "__main__":
    asyncio.run(populate_all_demo_data())
