from sqlmodel import Session, select
from backend.database import get_session, engine
from backend.models import AIAnalysis, Village

def populate_all_demo_data():
    with Session(engine) as session:
        # 1. Get the High Quality Demo Data from our template village
        template_id = "3524010001" 
        demo_analysis = session.exec(select(AIAnalysis).where(AIAnalysis.village_id == template_id)).first()
        
        if not demo_analysis or not demo_analysis.persona or demo_analysis.persona == "Unknown":
            print("Template data missing or invalid! Run inject_demo_data.py first.")
            return

        # 2. Get all villages
        villages = session.exec(select(Village)).all()
        count = 0
        
        for v in villages:
            if v.id == template_id:
                continue

            # Check if analysis exists
            if not v.ai_analysis:
                # Create new
                analysis = AIAnalysis(
                    village_id=v.id,
                    persona=demo_analysis.persona, # Share the same persona for demo
                    social_capital_narrative=demo_analysis.social_capital_narrative,
                    swot_analysis=demo_analysis.swot_analysis,
                    recommendations=demo_analysis.recommendations
                )
                session.add(analysis)
                count += 1
            else:
                # Update if empty/unknown
                aa = v.ai_analysis
                if not aa.persona or aa.persona == "Unknown":
                    aa.persona = demo_analysis.persona
                    aa.social_capital_narrative = demo_analysis.social_capital_narrative
                    aa.swot_analysis = demo_analysis.swot_analysis
                    aa.recommendations = demo_analysis.recommendations
                    session.add(aa)
                    count += 1
        
        session.commit()
        print(f"Successfully populated demo AI data for {count} villages.")

if __name__ == "__main__":
    populate_all_demo_data()
