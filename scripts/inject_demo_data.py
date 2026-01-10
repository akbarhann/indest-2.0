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

async def inject_demo_data():
    await init_db_script()

    # Target the village used in testing
    village_id = "3524010001"
    village = await Village.get(village_id)
    
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

    # Ensure ai_analysis object exists
    if not village.ai_analysis:
        village.ai_analysis = AIAnalysis()

    # Update fields
    village.ai_analysis.persona = mock_data["persona"]
    village.ai_analysis.social_capital_narrative = mock_data["social_capital_narrative"]
    village.ai_analysis.swot_analysis = mock_data["swot_analysis"]
    village.ai_analysis.recommendations = mock_data["recommendations"]
    
    await village.save()
    print(f"Successfully injected demo AI data for Village {village.name}")

if __name__ == "__main__":
    asyncio.run(inject_demo_data())
