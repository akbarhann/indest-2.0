from sqlmodel import Session, select
from backend.database import get_session, engine
from backend.models import AIAnalysis, Village

def inject_demo_data():
    with Session(engine) as session:
        # Target the village used in testing
        village_id = "3524010001"
        village = session.get(Village, village_id)
        
        if not village:
            print(f"Village {village_id} not found.")
            return

        # Prepare High Quality Mock Data
        mock_data = {
            "persona": "Sentra Agribisnis Berkelanjutan",
            "social_capital_narrative": "Warga Desa Donorejo memiliki semangat gotong royong yang kuat, terbukti dari pengelolaan irigasi swadaya yang telah berjalan selama puluhan tahun. Tradisi 'Merti Desa' menjadi simbol persatuan dan rasa syukur, sekaligus momen strategis untuk merencanakan pembangunan desa secara musyawarah.",
            "swot_analysis": {
                "strengths": [
                    "Ketersediaan sumber daya air yang melimpah irigasi teknis.",
                    "Kelompok tani yang aktif dan terorganisir.",
                    "Akses jalan desa sudah beraspal/beton."
                ],
                "weaknesses": [
                    "Ketergantungan pada pupuk kimia yang tinggi.",
                    "Minimnya fasilitas pengolahan pasca panen.",
                    "Literasi digital petani masih rendah."
                ],
                "opportunities": [
                    "Pengembangan pasar lelang komoditas online.",
                    "Diversifikasi produk olahan singkong/jagung.",
                    "Program desa wisata edukasi pertanian."
                ],
                "threats": [
                    "Fluktuasi harga komoditas sangat tinggi.",
                    "Regenerasi petani muda yang lambat.",
                    "Perubahan iklim yang mempengaruhi pola tanam."
                ]
            },
            "recommendations": {
                "recommendations": [
                    "Membangun Unit Pengolahan Pupuk Organik (UPPO) milik BUMDes.",
                    "Mengadakan pelatihan Digital Marketing untuk pemuda tani.",
                    "Kerjasama dengan startups agritech untuk akses pasar."
                ]
            }
        }

        # Check if AI analysis exists
        ai_analysis = session.exec(select(AIAnalysis).where(AIAnalysis.village_id == village_id)).first()
        
        if not ai_analysis:
            ai_analysis = AIAnalysis(village_id=village_id)
        
        # Update fields
        ai_analysis.persona = mock_data["persona"]
        ai_analysis.social_capital_narrative = mock_data["social_capital_narrative"]
        ai_analysis.swot_analysis = mock_data["swot_analysis"]
        ai_analysis.recommendations = mock_data["recommendations"]
        
        session.add(ai_analysis)
        session.commit()
        print(f"Successfully injected demo AI data for Village {village.name}")

if __name__ == "__main__":
    inject_demo_data()
