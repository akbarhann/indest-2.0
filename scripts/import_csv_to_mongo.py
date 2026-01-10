import csv
import sys
import os
import asyncio
from decimal import Decimal
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import (
    Village, Health, Education, Economy, Infrastructure, Digital, Disaster, AIAnalysis, Disease, Criminal,
    Social, Security, Sanitasi
)

CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "podes_dashboard_data.csv")

def parse_int(value):
    try:
        return int(float(value)) if value else 0
    except (ValueError, TypeError):
        return 0

def parse_decimal(value):
    try:
        return float(value) # MongoDB stores as double usually, or Decimal128 if mapped. Pydantic float is safer for now.
    except (ValueError, TypeError):
        return 0.0

async def init_db_script():
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv("MONGODB_DB_NAME", "indest_db")
    db = client[db_name]
    await init_beanie(database=db, document_models=[Village])

async def import_data():
    await init_db_script()
    
    # Check if data exists
    existing_count = await Village.count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} villages. Skipping import.")
        return

    print(f"Reading CSV from {CSV_FILE_PATH}...")
    
    if not os.path.exists(CSV_FILE_PATH):
        print(f"Error: CSV file not found at {CSV_FILE_PATH}")
        return

    villages_to_insert = []
    
    with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        count = 0
        for row in reader:
            # Helper for clean extraction
            def get_int(key): return parse_int(row.get(key, 0))
            def get_str(key): return row.get(key, '').strip()

            # --- Construct Embedded Models ---
            
            health = Health(
                jumlah_rumah_sakit=get_int('jumlah Rumah sakit') + get_int('jumlah Rumah Sakit Bersalin'),
                jumlah_puskesmas=get_int('jumlah Puskesmas dengan rawat inap') + get_int('jumlah Puskesmas tanpa rawat inap') + get_int('Jumlah Puskesmas Pembantu'),
                jumlah_klinik=get_int('Jumlah poliklinik/balai pengobatan') + get_int('Jumlah Rumah Bersalin'),
                jumlah_faskes_masyarakat=get_int('Jumlah poskesdes') + get_int('Jumlah polindes'),
                jumlah_farmasi=get_int('Jumlah apotek') + get_int('Jumlah toko jamu'),
                total_fasilitas_kesehatan=0, # Will recalc or trust input? Let's trust logic below
                jumlah_dokter=get_int('Jumlah Praktik Dokter') + get_int('Jumlah dokter gigi spesialis yang tinggal/menetap di desa'),
                jumlah_bidan=get_int('Jumlah Tempat Praktik Bidan') + get_int('Jumlah bidan yang tinggal/menetap di desa'),
                jumlah_tenaga_kesehatan_lain=get_int('Jumlah tenaga kesehatan lainnya (apoteker, perawat, tenaga gizi, dll.)'),
                total_tenaga_kesehatan=0
            )
            health.total_fasilitas_kesehatan = (health.jumlah_rumah_sakit + health.jumlah_puskesmas + health.jumlah_klinik + health.jumlah_faskes_masyarakat + health.jumlah_farmasi)
            health.total_tenaga_kesehatan = (health.jumlah_dokter + health.jumlah_bidan + health.jumlah_tenaga_kesehatan_lain)

            education = Education(
                sd_negeri=get_int('Jumlah sarana pendidikan negeri didesa : SD'),
                sd_swasta=get_int('Jumlah sarana pendidikan swasta didesa : SD'),
                mi_negeri=get_int('Jumlah sarana pendidikan negeri didesa: MI'),
                mi_swasta=get_int('Jumlah sarana pendidikan swasta didesa: MI'),
                smp_negeri=get_int('Jumlah sarana pendidikan negeri didesa: SMP'),
                smp_swasta=get_int('Jumlah sarana pendidikan swasta didesa: SMP'),
                mts_negeri=get_int('Jumlah sarana pendidikan negeri didesa: MTS'),
                mts_swasta=get_int('Jumlah sarana pendidikan swasta didesa: MTS'),
                sma_negeri=get_int('Jumlah sarana pendidikan negeri didesa: SMA'),
                sma_swasta=get_int('Jumlah sarana pendidikan swasta didesa: SMA'),
                ma_negeri=get_int('Jumlah sarana pendidikan negeri didesa: MA'),
                ma_swasta=get_int('Jumlah sarana pendidikan swasta didesa: MA'),
                smk_negeri=get_int('Jumlah sarana pendidikan negeri didesa: SMK'),
                smk_swasta=get_int('Jumlah sarana pendidikan swasta didesa: SMK'),
                universities_negeri=get_int('Jumlah sarana pendidikan negeri didesa: Perguruan Tinggi'),
                universities_swasta=get_int('Jumlah sarana pendidikan swasta didesa: Perguruan Tinggi'),
            )
            # Calculated fields
            education.sd_counts = education.sd_negeri + education.sd_swasta + education.mi_negeri + education.mi_swasta
            education.smp_counts = education.smp_negeri + education.smp_swasta + education.mts_negeri + education.mts_swasta
            education.sma_counts = education.sma_negeri + education.sma_swasta + education.ma_negeri + education.ma_swasta
            education.smk_counts = education.smk_negeri + education.smk_swasta
            education.universities = education.universities_negeri + education.universities_swasta

            economy = Economy(
                primary_income=get_str('Sumber penghasilan utama sebagian besar penduduk desa/kelurahan berasal dari lapangan usaha:'),
                markets=get_int('Jumlah pasar dengan bangunan permanen') + get_int('Jumlah pasar dengan bangunan semi permanen') + get_int('Jumlah pasar tanpa bangunan'),
                cooperatives=get_int('Jumlah Koperasi Unit Desa (KUD) di desa/kelurahan yang masih aktif') + get_int('Jumlah Koperasi Industri Kecil dan Kerajinan Rakyat (Kopinkra)/Usaha mikro di desa/kelurahan yang masih aktif') + get_int('Jumlah Koperasi Simpan Pinjam (KSP) di desa/kelurahan yang masih aktif') + get_int('Jumlah Koperasi lainnya di desa/kelurahan yang masih aktif'),
                bumdes=get_int('Jumlah unit usaha BUMDes'),
                grocery=get_int('Jumlah toko/warung kelontong'),
                eatery=get_int('Jumlah warung/kedai makanan minuman'),
                restaurant=get_int('Jumlah restoran/rumah makan'),
                supermarket=get_int('Jumlah minimarket/swalayan/supermarket'),
                hotels=get_int('Jumlah penginapan (hostel/motel/losmen/wisma)'),
                bank=get_int('Keberadaan sarana penunjang ekonomi Agen Bank'),
                non_metallic_mining_industry=get_int('Jumlah industri barang galian bukan logam/industri gerabah/keramik/batu bata (ggenteng, batu bata, porselin, tegel, keramik, kaca patri, cangkir, guci, dll)'),
                paper_and_pulp_industry=get_int('Jumlah industri kertas dan barang dari kertas (kantong kertas, post card, kardus, rak semen)'),
                printing_industry=get_int('Jumlah industri percetakan dan reproduksi media rekaman (buku, brosur, kartu nama, kalender, spanduk, dll)')
            )

            infrastructure = Infrastructure(
                State_electricity_company=get_int('Jumlah keluarga pengguna listrik PLN'),
                Non_state_electricity_company=get_int('Jumlah keluarga pengguna listrik NON-PLN'),
                non_electricity=get_int('Jumlah keluarga bukan pengguna listrik'),
                rural_solar_street_lights=get_str('Penerangan jalan desa dengan lampu tenaga surya'),
                rural_main_street_lights=get_str('Penerangan di jalan utama desa/kelurahan'),
                water_drink_source=get_str('Sumber air minum sebagian besar keluarga'),
                cooking_fuel=get_str('Bahan bakar memasak sebagian besar keluarga')
            )
            infrastructure.electricity_source="PLN" if infrastructure.State_electricity_company > infrastructure.Non_state_electricity_company else "Non-PLN"

            digital = Digital(
                signal_strength=get_str('Sinyal telepon seluler/handphone di sebagian besar wilayah desa/kelurahan (sinyal sangat kuat, sinyal kuat, sinyal lemah, tidak ada sinyal)'),
                signal_type=get_str('Jenis_sinyal_internet'),
                bts_count=get_int('Jumlah menara telepon seluler atau Base Transceiver Station (BTS)'),
                village_information_system=get_str('Keberadaan sistem informasi desa')
            )

            disaster = Disaster(
                drought_exist=get_str('kekeringan (kejadian bencana alam)'),
                drought_victim=get_int('Kekeringan (jumlah korban meninggal tahun 2024)'),
                flood_exist=get_str('Banjir(kejadian bencana alam)'),
                flood_victim=get_int('Banjir (jumlah korban meninggal tahun 2024)'),
                landslide_exist=get_str('Tanah longsor (kejadian bencana alam)'),
                landslide_victim=get_int('Tanah longsor (jumlah korban meninggal tahun 2024)'),
                sea_waves_exist=get_str('Gelombang air laut (kejadian bencana alam)'),
                sea_waves_victim=get_int('Gelombang air laut (jumlah korban meninggal tahun 2024)'),
                hurricane_exist=get_str('topan (kejadian bencana alam)'),
                hurricane_victim=get_int('topan (jumlah korban meninggal tahun 2024)'),
                earthquake_exist=get_str('gempa bumi (kejadian bencana alam)'),
                earthquake_victim=get_int('gempa bumi (jumlah korban meninggal tahun 2024)'),
                flash_flood_exist=get_str('Banjir Bandang (kejadian bencana alam)'),
                flash_flood_victim=get_int('Banjir Bandang (jumlah korban meninggal tahun 2024)'),
                tsunami_exist=get_str('tsunami (kejadian bencana alam)'),
                tsunami_victim=get_int('tsunami (jumlah korban meninggal tahun 2024)'),
                volcanic_eruption_exist=get_str('gunung meletus (kejadian bencana alam)'),
                volcanic_eruption_victim=get_int('gunung meletus (jumlah korban meninggal tahun 2024)'),
                warning_system=get_str('Keberadaan sistem peringatan dini bencana alam')
            )

            disease = Disease(
                muntaber_cases=get_int('Jumlah penderita Muntaber selama setahun terakhir'),
                muntaber_deaths=get_int('Jumlah penderita meninggal Muntaber selama setahun terakhir'),
                dbd_cases=get_int('Jumlah penderita Demam Berdarah selama setahun terakhir'),
                dbd_deaths=get_int('Jumlah penderita meninggal Demam Berdarah selama setahun terakhir'),
                campak_cases=get_int('Jumlah penderita Campak selama setahun terakhir'),
                campak_deaths=get_int('Jumlah penderita meninggal Campak selama setahun terakhir'),
                malaria_cases=get_int('Jumlah penderita Malaria selama setahun terakhir'),
                malaria_deaths=get_int('Jumlah penderita meninggal Malaria selama setahun terakhir'),
                sars_cases=get_int('Jumlah penderita SARS/Flu Burung selama setahun terakhir'),
                sars_deaths=get_int('Jumlah penderita meninggal SARS/Flu Burung selama setahun terakhir'),
                hepatitis_e_cases=get_int('Jumlah penderita Hepatitis E selama setahun terakhir'),
                hepatitis_e_deaths=get_int('Jumlah penderita meninggal Hepatitis E selama setahun terakhir'),
                difteri_cases=get_int('Jumlah penderita Difteri selama setahun terakhir'),
                difteri_deaths=get_int('Jumlah penderita meninggal Difteri selama setahun terakhir'),
                covid_cases=get_int('Jumlah penderita COVID-19 selama setahun terakhir'),
                covid_deaths=get_int('Jumlah penderita meninggal COVID-19 selama setahun terakhir'),
            )
            disease.infectious_cases = (disease.muntaber_cases + disease.dbd_cases + disease.campak_cases + disease.malaria_cases + disease.sars_cases + disease.hepatitis_e_cases + disease.difteri_cases + disease.covid_cases)
            disease.infectious_deaths = (disease.muntaber_deaths + disease.dbd_deaths + disease.campak_deaths + disease.malaria_deaths + disease.sars_deaths + disease.hepatitis_e_deaths + disease.difteri_deaths + disease.covid_deaths)
            
            # --- Disability Population (Risk Group) ---
            disease.disability_population = (
                get_int('Jumlah penyandang tuna netra (buta)') + 
                get_int('Jumlah penyandang tuna rungu (tuli)') + 
                get_int('Jumlah penyandang tuna wicara (bisu)') + 
                get_int('Jumlah penyandang tuna rungu-wicara (tuli-bisu)') + 
                get_int('Jumlah penyandang tuna daksa (disabilitas tubuh) : kelumpuhan/kelainan/ketidaklengkapan anggota gerak') + 
                get_int('Jumlah penyandang tuna grahita (keterbelakangan mental)') + 
                get_int('Jumlah penyandang tuna laras (eks-sakit jiwa, mengalami hambatan/gangguan dalam mengendalikan emosi dan kontrol sosial)') + 
                get_int('Jumlah penyandang tuna eks-sakit kusta : pernah mengalami sakit kusta dan telah dinyatakan sembuh oleh dokter') + 
                get_int('Jumlah penyandang tuna ganda (fisik-mental): fisik(buta, tuli, bisu, bisu-tuli atau tubuh) dan mental (tunagrahita atau tunalaras)')
            )
            
             # Logic for most cases/deaths
            disease_cases_map = {
                'Muntaber': disease.muntaber_cases, 'Demam Berdarah': disease.dbd_cases, 'Campak': disease.campak_cases,
                'Malaria': disease.malaria_cases, 'SARS/Flu Burung': disease.sars_cases, 'Hepatitis E': disease.hepatitis_e_cases,
                'Difteri': disease.difteri_cases, 'COVID-19': disease.covid_cases
            }
            disease.most_cases_disease = max(disease_cases_map, key=disease_cases_map.get)

            criminal = Criminal(
                suicide_count_man=get_int('Jumlah korban bunuh diri (termasuk percobaan bunuh diri) selama setahun terakhir - laki-laki'),
                suicide_count_woman=get_int('Jumlah korban bunuh diri (termasuk percobaan bunuh diri) selama setahun terakhir - perempuan'),
                murderer_case_man=get_int('Jumlah pembunuhan selama setahun terakhir - laki-laki'),
                murderer_case_woman=get_int('Jumlah pembunuhan selama setahun terakhir - perempuan')
            )

            social = Social(
                religion=get_int('Agama/kepercayaan utama yang dianut olwh sebagian besar warga di desa/kelurahan'),
                mosque=get_int('Jumlah tempat ibadah di desa/kelurahan - masjid'),
                musala=get_int('Jumlah tempat ibadah di desa/kelurahan - surau/langgar/musala'),
                church_christian=get_int('Jumlah tempat ibadah di desa/kelurahan - gereja Kristen'),
                church_catholic=get_int('Jumlah tempat ibadah di desa/kelurahan - gereja Katolik'),
                migran_man=get_int('Jumlah warga laki laki desa/kelurahan yang sedang bekerja sebagai Pekerja Migran Indonesia/TKI '),
                migran_woman=get_int('Jumlah warga perempuan desa/kelurahan yang sedang bekerja sebagai Pekerja Migran Indonesia/TKI '),
                pub=get_str('Keberadaan pub/diskotek/tempat karaoke yang masih berfungsi di desa/kelurahan')
            )

            security = Security(
                maintenance=get_str('Pembangunan/pemeliharaan pos keamanan lingkungan'),
                security_group=get_str('Pembentukan/pengaturan regu keamanan'),
                pelaporan=get_str('Pelaporan tamu menginap >24 jam ke aparat'),
                security_system=get_str('Pengaktifan sistem keamanan lingkungan oleh warga'),
                linmas=get_int('Jumlah anggota linmas/hansip')
            )

            sanitasi = Sanitasi(
                sampah=get_str('Tempat buang sampah sebagian besar keluarga'),
                tiga_r=get_str('Keberadaan TPS3R (Reduce, Reuse, Recycle)'),
                bank_sampah=get_str('Keberadaan bank sampah di desa/kelurahan'),
                pemilahan=get_str('Pemilahan sampah membusuk dan sampah kering'),
                toilet=get_str('Penggunaan fasilitas buang air besar sebagian besar keluarga'),
                limbah_cair=get_str('Saluran pembuangan limbah cair dari air mandi/cuci Sebagian besar keluarga'),
                slum=get_str('Keberadaan permukiman kumuh di desa/kelurahan'),
                pencemaran_air=get_str('Jenis pencemaran lingkungan hidup - Air'),
                pencemaran_udara=get_str('Jenis pencemaran lingkungan hidup - Udara'),
                pencemaran_lingkungan=get_str('Jenis pencemaran lingkungan hidup - Tanah')
            )

            ai_analysis = AIAnalysis() # Empty default

            # --- Construct Main Document ---
            
            village = Village(
                id=get_str('IDDESA'),
                name=get_str('NAMA_DESA'),
                district=get_str('NAMA_KEC'),
                latitude=parse_decimal(row.get('latitude', 0)),
                longitude=parse_decimal(row.get('longitude', 0)),
                topography=get_str('Topografi sebagian besar wilayah desa/kelurahan'),
                forest_location=get_str('Lokasi wilayah desa/kelurahan terhadap kawasan hutan/hutan:'),
                status=get_str('Status pemerintahan desa/kelurahan (Desa/Kelurahan/UPT-SPT/Nagari)'),
                
                # Embeddings
                health=health,
                education=education,
                economy=economy,
                infrastructure=infrastructure,
                digital=digital,
                disaster=disaster,
                disease=disease,
                criminal=criminal,
                social=social,
                security=security,
                sanitasi=sanitasi,
                ai_analysis=ai_analysis
            )
            
            villages_to_insert.append(village)
            count += 1
            if count % 100 == 0:
                print(f"Processed {count} rows...")

    if villages_to_insert:
        print(f"Inserting {len(villages_to_insert)} villages into MongoDB...")
        await Village.insert_many(villages_to_insert)
        print("Done.")

if __name__ == "__main__":
    asyncio.run(import_data())
