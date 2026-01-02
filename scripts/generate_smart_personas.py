from sqlmodel import Session, select
from backend.database import get_session, engine
from backend.models import AIAnalysis, Village
import random

def generate_smart_persona(village: Village) -> dict:
    # 1. Determine Base Identity from Economy & Topography
    income = (village.economy.primary_income if village.economy else "Umum").lower()
    topo = (village.topography or "Dataran").lower()
    
    identity = "Desa Mandiri"
    if "pertanian" in income:
        if "lereng" in topo or "puncak" in topo:
            identity = "Agrowisata Pegunungan"
        else:
            identity = "Lumbung Pangan Lestari"
    elif "perkebunan" in income:
        identity = "Sentra Perkebunan Rakyat"
    elif "perikanan" in income:
        identity = "Kampung Nelayan Modern" if "laut" in topo else "Minapolitan Darat"
    elif "perdagangan" in income or (village.economy and village.economy.markets > 0):
        identity = "Simpul Perniagaan"
    elif "industri" in income:
        identity = "Desa Kreatif-Produktif"
    
    # 2. Add Modifier based on Status/Digital
    modifier = ""
    is_digital = village.digital and "4g" in (village.digital.signal_strength or "").lower()
    is_advanced = village.status == "Mandiri"
    
    if is_digital and is_advanced:
        modifier = "Digital"
    elif is_advanced:
        modifier = "Unggulan"
    elif is_digital:
        modifier = "Terkoneksi"
    
    final_persona = f"{identity} {modifier}".strip()
    
    # 3. Construct Narrative
    geo_desc = f"di wilayah {topo}"
    strength = "semangat gotong royong"
    if village.health and village.health.posyandu > 5:
        strength = "kepedulian kesehatan"
    if village.education and village.education.universities > 0:
        strength = "fokus pendidikan"
        
    narrative = (
        f"Masyarakat {village.name} yang terletak {geo_desc} memiliki {strength} yang kuat. "
        f"Mereka bahu-membahu mengembangkan potensi {income} sebagai pilar ekonomi utama, "
        f"menjadikan desa ini sebagai {final_persona} yang tangguh."
    )
    
    # 4. Synthesize SWOT (Simplified rules)
    swot = {
        "strengths": [f"Potensi {income} yang melimpah", "Modal sosial warga yang kuat"],
        "weaknesses": ["Keterbatasan akses pasar global", "Perlu peningkatan infrastruktur"],
        "opportunities": ["Digitalisasi produk desa", "Pengembangan ekowisata"],
        "threats": ["Fluktuasi harga komoditas", "Perubahan iklim"]
    }

    if is_digital:
        swot["strengths"].append("Konektivitas internet yang baik")
        swot["opportunities"].append("Pemasaran online via marketplace")
    else:
        swot["weaknesses"].append("Sinyal komunikasi belum merata")

    return {
        "persona": final_persona,
        "social_capital_narrative": narrative,
        "swot_analysis": swot,
        "recommendations": {"recommendations": ["Optimalisasi BUMDes", "Pelatihan SDM"]}
    }

def apply_smart_personas():
    with Session(engine) as session:
        villages = session.exec(select(Village)).all()
        count = 0
        
        print(f"Analyzing {len(villages)} villages...")
        
        for v in villages:
            # Generate tailored insights
            insights = generate_smart_persona(v)
            
            if not v.ai_analysis:
                analysis = AIAnalysis(
                    village_id=v.id,
                    persona=insights["persona"],
                    social_capital_narrative=insights["social_capital_narrative"],
                    swot_analysis=insights["swot_analysis"],
                    recommendations=insights["recommendations"]
                )
                session.add(analysis)
            else:
                # Update existing
                v.ai_analysis.persona = insights["persona"]
                v.ai_analysis.social_capital_narrative = insights["social_capital_narrative"]
                v.ai_analysis.swot_analysis = insights["swot_analysis"]
                v.ai_analysis.recommendations = insights["recommendations"]
                session.add(v.ai_analysis)
            
            count += 1
            
        session.commit()
        print(f"Successfully synthesized unique personas for {count} villages.")

if __name__ == "__main__":
    apply_smart_personas()
