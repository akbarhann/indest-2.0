import csv
import sys
import os
from decimal import Decimal

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select, SQLModel
from backend.database import engine, create_db_and_tables
from backend.models import (
    Village, Health, Education, Economy, Infrastructure, Digital, Disaster, AIAnalysis, Disease, Criminal,
    Social, Security, Sanitasi
)

CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "podes_dashboard_data.csv")

def parse_int(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0

def parse_decimal(value):
    try:
        return Decimal(value)
    except (ValueError, TypeError):
        return Decimal("0.0")

def migrate_data():
    print("Creating tables...")
    SQLModel.metadata.drop_all(engine)
    create_db_and_tables()
    
    print(f"Reading CSV from {CSV_FILE_PATH}...")
    
    if not os.path.exists(CSV_FILE_PATH):
        print(f"Error: CSV file not found at {CSV_FILE_PATH}")
        return

    with Session(engine) as session:
        with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            count = 0
            for row in reader:
                # 1. Village Core
                village_id = row['IDDESA']
                
                # Check if exists
                existing = session.exec(select(Village).where(Village.id == village_id)).first()
                if existing:
                    print(f"Skipping existing village: {village_id}")
                    continue

                village = Village(
                    id=village_id,
                    name=row['NAMA_DESA'],
                    district=row['NAMA_KEC'],
                    latitude=parse_decimal(row['latitude']),
                    longitude=parse_decimal(row['longitude']),
                    topography=row['Topografi sebagian besar wilayah desa/kelurahan'],
                    forest_location=row['Lokasi wilayah desa/kelurahan terhadap kawasan hutan/hutan:'],
                    status=row['Status pemerintahan desa/kelurahan (Desa/Kelurahan/UPT-SPT/Nagari)']
                )
                session.add(village)
                
                # Calculate Health variables first
                jumlah_rumah_sakit = (
                    parse_int(row.get('jumlah Rumah sakit', 0)) +
                    parse_int(row.get('jumlah Rumah Sakit Bersalin', 0))
                )

                jumlah_puskesmas = (
                    parse_int(row.get('jumlah Puskesmas dengan rawat inap', 0)) +
                    parse_int(row.get('jumlah Puskesmas tanpa rawat inap', 0)) +
                    parse_int(row.get('Jumlah Puskesmas Pembantu', 0))
                )

                jumlah_klinik = (
                    parse_int(row.get('Jumlah poliklinik/balai pengobatan', 0)) +
                    parse_int(row.get('Jumlah Rumah Bersalin', 0))
                )

                jumlah_faskes_masyarakat = (
                    parse_int(row.get('Jumlah poskesdes', 0)) +
                    parse_int(row.get('Jumlah polindes', 0))
                )

                jumlah_farmasi = (
                    parse_int(row.get('Jumlah apotek', 0)) +
                    parse_int(row.get('Jumlah toko jamu', 0))
                )

                total_fasilitas_kesehatan = (
                    jumlah_rumah_sakit +
                    jumlah_puskesmas +
                    jumlah_klinik +
                    jumlah_faskes_masyarakat +
                    jumlah_farmasi
                )

                jumlah_dokter = (
                    parse_int(row.get('Jumlah Praktik Dokter', 0)) +
                    parse_int(row.get('Jumlah dokter gigi spesialis yang tinggal/menetap di desa', 0))
                )

                jumlah_bidan = (
                    parse_int(row.get('Jumlah Tempat Praktik Bidan', 0)) +
                    parse_int(row.get('Jumlah bidan yang tinggal/menetap di desa', 0))
                )

                jumlah_tenaga_kesehatan_lain = parse_int(
                    row.get('Jumlah tenaga kesehatan lainnya (apoteker, perawat, tenaga gizi, dll.)', 0)
                )

                total_tenaga_kesehatan = (
                    jumlah_dokter +
                    jumlah_bidan +
                    jumlah_tenaga_kesehatan_lain
                )

                health = Health(
                    village_id=village_id,
                    jumlah_rumah_sakit=jumlah_rumah_sakit,
                    jumlah_puskesmas=jumlah_puskesmas,
                    jumlah_klinik=jumlah_klinik,
                    jumlah_faskes_masyarakat=jumlah_faskes_masyarakat,
                    jumlah_farmasi=jumlah_farmasi,
                    total_fasilitas_kesehatan=total_fasilitas_kesehatan,
                    jumlah_dokter=jumlah_dokter,
                    jumlah_bidan=jumlah_bidan,
                    jumlah_tenaga_kesehatan_lain=jumlah_tenaga_kesehatan_lain,
                    total_tenaga_kesehatan=total_tenaga_kesehatan
                )
                session.add(health)
                
                # 3. Education
                sd = parse_int(row.get('Jumlah sarana pendidikan negeri didesa : SD', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa : SD', 0)) + parse_int(row.get('Jumlah sarana pendidikan negeri didesa: MI', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: MI', 0))
                smp = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: SMP', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: SMP', 0)) + parse_int(row.get('Jumlah sarana pendidikan negeri didesa: MTS', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: MTS', 0))
                sma = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: SMA', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: SMA', 0)) + parse_int(row.get('Jumlah sarana pendidikan negeri didesa: MA', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: MA', 0))
                smk = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: SMK', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: SMK', 0))
                univ = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: Perguruan Tinggi', 0)) + parse_int(row.get('Jumlah sarana pendidikan swasta didesa: Perguruan Tinggi', 0))

                education = Education(
                    village_id=village_id,
                    sd_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa : SD', 0)),
                    sd_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa : SD', 0)),
                    mi_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: MI', 0)),
                    mi_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: MI', 0)),
                    smp_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: SMP', 0)),
                    smp_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: SMP', 0)),
                    mts_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: MTS', 0)),
                    mts_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: MTS', 0)),
                    sma_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: SMA', 0)),
                    sma_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: SMA', 0)),
                    ma_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: MA', 0)),
                    ma_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: MA', 0)),
                    smk_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: SMK', 0)),
                    smk_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: SMK', 0)),
                    universities_negeri = parse_int(row.get('Jumlah sarana pendidikan negeri didesa: Perguruan Tinggi', 0)),
                    universities_swasta = parse_int(row.get('Jumlah sarana pendidikan swasta didesa: Perguruan Tinggi', 0)),
                    sd_counts=sd,
                    smp_counts=smp,
                    sma_counts=sma,
                    smk_counts=smk,
                    universities=univ
                )
                session.add(education)
                
                # 4. Economy
                economy = Economy(
                    village_id=village_id,
                    primary_income=row.get('Sumber penghasilan utama sebagian besar penduduk desa/kelurahan berasal dari lapangan usaha:', ''),
                    markets=parse_int(row.get('Jumlah pasar dengan bangunan permanen', 0)) + parse_int(row.get('Jumlah pasar dengan bangunan semi permanen', 0)) + parse_int(row.get('Jumlah pasar tanpa bangunan', 0)),
                    cooperatives=parse_int(row.get('Jumlah Koperasi Unit Desa (KUD) di desa/kelurahan yang masih aktif', 0)) + parse_int(row.get('Jumlah Koperasi Industri Kecil dan Kerajinan Rakyat (Kopinkra)/Usaha mikro di desa/kelurahan yang masih aktif', 0)) + parse_int(row.get('Jumlah Koperasi Simpan Pinjam (KSP) di desa/kelurahan yang masih aktif', 0)) + parse_int(row.get('Jumlah Koperasi lainnya di desa/kelurahan yang masih aktif', 0)),
                    bumdes=parse_int(row.get('Jumlah unit usaha BUMDes', 0)),
                    grocery=parse_int(row.get('Jumlah toko/warung kelontong', 0)),
                    eatery=parse_int(row.get('Jumlah warung/kedai makanan minuman', 0)),
                    restaurant = parse_int(row.get('Jumlah restoran/rumah makan', 0)),
                    supermarket = parse_int(row.get('Jumlah minimarket/swalayan/supermarket', 0)),
                    hotels = parse_int(row.get('Jumlah penginapan (hostel/motel/losmen/wisma)', 0)),
                    bank = parse_int(row.get('Keberadaan sarana penunjang ekonomi Agen Bank', 0)),
                    non_metallic_mining_industry = parse_int(row.get('Jumlah industri barang galian bukan logam/industri gerabah/keramik/batu bata (ggenteng, batu bata, porselin, tegel, keramik, kaca patri, cangkir, guci, dll)', 0)),
                    paper_and_pulp_industry = parse_int(row.get('Jumlah industri kertas dan barang dari kertas (kantong kertas, post card, kardus, rak semen)', 0)),
                    printing_industry = parse_int(row.get('Jumlah industri percetakan dan reproduksi media rekaman (buku, brosur, kartu nama, kalender, spanduk, dll)', 0))
                )
                session.add(economy)
                
                # 5. Infrastructure
                infrastructure = Infrastructure(
                    village_id=village_id,
                    State_electricity_company = parse_int(row.get('Jumlah keluarga pengguna listrik PLN', 0)),
                    Non_state_electricity_company = parse_int(row.get('Jumlah keluarga pengguna listrik NON-PLN', 0)),
                    non_electricity = parse_int(row.get('Jumlah keluarga bukan pengguna listrik', 0)),
                    electricity_source="PLN" if parse_int(row.get('Jumlah keluarga pengguna listrik PLN', 0)) > parse_int(row.get('Jumlah keluarga pengguna listrik NON-PLN', 0)) else "Non-PLN",
                    rural_solar_street_lights = row.get('Penerangan jalan desa dengan lampu tenaga surya', ''),
                    rural_main_street_lights = row.get('Penerangan di jalan utama desa/kelurahan', ''),
                    water_drink_source=row.get('Sumber air minum sebagian besar keluarga', ''),
                    water_access_source = row.get()
                    cooking_fuel = row.get('Bahan bakar memasak sebagian besar keluarga', '')
                )
                session.add(infrastructure)
                
                # 6. Digital
                digital = Digital(
                    village_id=village_id,
                    signal_strength=row.get('Sinyal telepon seluler/handphone di sebagian besar wilayah desa/kelurahan (sinyal sangat kuat, sinyal kuat, sinyal lemah, tidak ada sinyal)', ''),
                    signal_type = row.get('Jenis_sinyal_internet', ''),
                    bts_count=parse_int(row.get('Jumlah menara telepon seluler atau Base Transceiver Station (BTS)', 0)),
                    village_information_system = row.get('Keberadaan sistem informasi desa', '')
                )   
                session.add(digital)
                
                # 7. Disaster
                disaster = Disaster(
                    village_id=village_id,
                    drought_exist=row.get('kekeringan (kejadian bencana alam)', ''),
                    drought_victim=parse_int(row.get('Kekeringan (jumlah korban meninggal tahun 2024)', 0)),
                    flood_exist=row.get('Banjir(kejadian bencana alam)', ''),
                    flood_victim=parse_int(row.get('Banjir (jumlah korban meninggal tahun 2024)', 0)),
                    landslide_exist=row.get('Tanah longsor (kejadian bencana alam)', ''),
                    landslide_victim=parse_int(row.get('Tanah longsor (jumlah korban meninggal tahun 2024)', 0)),
                    sea_waves_exist=row.get('Gelombang air laut (kejadian bencana alam)', ''),
                    sea_waves_victim=parse_int(row.get('Gelombang air laut (jumlah korban meninggal tahun 2024)', 0)),
                    hurricane_exist=row.get('topan (kejadian bencana alam)', ''),
                    hurricane_victim=parse_int(row.get('topan (jumlah korban meninggal tahun 2024)', 0)),
                    earthquake_exist=row.get('gempa bumi (kejadian bencana alam)', ''),
                    earthquake_victim=parse_int(row.get('gempa bumi (jumlah korban meninggal tahun 2024)', 0)),
                    flash_flood_exist=row.get('Banjir Bandang (kejadian bencana alam)', ''),
                    flash_flood_victim=parse_int(row.get('Banjir Bandang (jumlah korban meninggal tahun 2024)', 0)),
                    tsunami_exist=row.get('tsunami (kejadian bencana alam)', ''),
                    tsunami_victim=parse_int(row.get('tsunami (jumlah korban meninggal tahun 2024)', 0)),
                    volcanic_eruption_exist=row.get('gunung meletus (kejadian bencana alam)', ''),
                    volcanic_eruption_victim=parse_int(row.get('gunung meletus (jumlah korban meninggal tahun 2024)', 0)),
                    warning_system=row.get('Keberadaan sistem peringatan dini bencana alam', '')
                )
                session.add(disaster)

                # 11. Disease
                muntaber_cases = parse_int(row.get('Jumlah penderita Muntaber selama setahun terakhir', 0))
                muntaber_deaths = parse_int(row.get('Jumlah penderita meninggal Muntaber selama setahun terakhir', 0))

                dbd_cases = parse_int(row.get('Jumlah penderita Demam Berdarah selama setahun terakhir', 0))
                dbd_deaths = parse_int(row.get('Jumlah penderita meninggal Demam Berdarah selama setahun terakhir', 0))

                campak_cases = parse_int(row.get('Jumlah penderita Campak selama setahun terakhir', 0))
                campak_deaths = parse_int(row.get('Jumlah penderita meninggal Campak selama setahun terakhir', 0))

                malaria_cases = parse_int(row.get('Jumlah penderita Malaria selama setahun terakhir', 0))
                malaria_deaths = parse_int(row.get('Jumlah penderita meninggal Malaria selama setahun terakhir', 0))

                sars_cases = parse_int(row.get('Jumlah penderita SARS/Flu Burung selama setahun terakhir', 0))
                sars_deaths = parse_int(row.get('Jumlah penderita meninggal SARS/Flu Burung selama setahun terakhir', 0))

                hepatitis_e_cases = parse_int(row.get('Jumlah penderita Hepatitis E selama setahun terakhir', 0))
                hepatitis_e_deaths = parse_int(row.get('Jumlah penderita meninggal Hepatitis E selama setahun terakhir', 0))

                difteri_cases = parse_int(row.get('Jumlah penderita Difteri selama setahun terakhir', 0))
                difteri_deaths = parse_int(row.get('Jumlah penderita meninggal Difteri selama setahun terakhir', 0))

                covid_cases = parse_int(row.get('Jumlah penderita COVID-19 selama setahun terakhir', 0))
                covid_deaths = parse_int(row.get('Jumlah penderita meninggal COVID-19 selama setahun terakhir', 0))

                infectious_cases = (
                    muntaber_cases +
                    dbd_cases +
                    campak_cases +
                    malaria_cases +
                    sars_cases +
                    hepatitis_e_cases +
                    difteri_cases +
                    covid_cases
                )

                infectious_deaths = (
                    muntaber_deaths +
                    dbd_deaths +
                    campak_deaths +
                    malaria_deaths +
                    sars_deaths +
                    hepatitis_e_deaths +
                    difteri_deaths +
                    covid_deaths
                )
                
                disease_cases_map = {
                    'Muntaber': muntaber_cases,
                    'Demam Berdarah': dbd_cases,
                    'Campak': campak_cases,
                    'Malaria': malaria_cases,
                    'SARS/Flu Burung': sars_cases,
                    'Hepatitis E': hepatitis_e_cases,
                    'Difteri': difteri_cases,
                    'COVID-19': covid_cases
                }

                disease_deaths_map = {
                    'Muntaber': muntaber_deaths,
                    'Demam Berdarah': dbd_deaths,
                    'Campak': campak_deaths,
                    'Malaria': malaria_deaths,
                    'SARS/Flu Burung': sars_deaths,
                    'Hepatitis E': hepatitis_e_deaths,
                    'Difteri': difteri_deaths,
                    'COVID-19': covid_deaths
                }

                most_cases_disease = max(disease_cases_map, key=disease_cases_map.get)
                most_deaths_disease = max(disease_deaths_map, key=disease_deaths_map.get)
                
                disability_population = (
                    parse_int(row.get('Jumlah penyandang tuna netra (buta)', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna rungu (tuli)', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna wicara (bisu)', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna rungu-wicara (tuli-bisu)', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna daksa (disabilitas tubuh) : kelumpuhan/kelainan/ketidaklengkapan anggota gerak', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna grahita (keterbelakangan mental)', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna laras (eks-sakit jiwa, mengalami hambatan/gangguan dalam mengendalikan emosi dan kontrol sosial)', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna eks-sakit kusta : pernah mengalami sakit kusta dan telah dinyatakan sembuh oleh dokter', 0)) +
                    parse_int(row.get('Jumlah penyandang tuna ganda (fisik-mental): fisik(buta, tuli, bisu, bisu-tuli atau tubuh) dan mental (tunagrahita atau tunalaras)', 0))
                )

                disease = Disease(
                    village_id=village_id,
                    muntaber_cases=muntaber_cases,
                    muntaber_deaths=muntaber_deaths,
                    dbd_cases=dbd_cases,
                    dbd_deaths=dbd_deaths,
                    campak_cases=campak_cases,
                    campak_deaths=campak_deaths,
                    malaria_cases=malaria_cases,
                    malaria_deaths=malaria_deaths,
                    sars_cases=sars_cases,
                    sars_deaths=sars_deaths,
                    hepatitis_e_cases=hepatitis_e_cases,
                    hepatitis_e_deaths=hepatitis_e_deaths,
                    difteri_cases=difteri_cases,
                    difteri_deaths=difteri_deaths,
                    covid_cases=covid_cases,
                    covid_deaths=covid_deaths,
                    infectious_cases=infectious_cases,
                    infectious_deaths=infectious_deaths,
                    most_cases_disease=most_cases_disease,
                    most_deaths_disease=most_deaths_disease,
                    disability_population=disability_population
                )
                session.add(disease)
                
                #new
                social = Social(
                    village_id=village_id,
                    religion = row.get('Agama/kepercayaan utama yang dianut olwh sebagian besar warga di desa/kelurahan', 0), # 1 = 'islam', nilai semua baris hanya 1
                    mosque = parse_int(row.get('Jumlah tempat ibadah di desa/kelurahan - masjid', 0)),
                    musala = parse_int(row.get('Jumlah tempat ibadah di desa/kelurahan - surau/langgar/musala', 0)),
                    church_christian = parse_int(row.get('Jumlah tempat ibadah di desa/kelurahan - gereja Kristen', 0)),
                    church_catholic = parse_int(row.get('Jumlah tempat ibadah di desa/kelurahan - gereja Katolik', 0)),
                    migran_man = parse_int(row.get('Jumlah warga laki laki desa/kelurahan yang sedang bekerja sebagai Pekerja Migran Indonesia/TKI ', 0)),
                    migran_woman = parse_int(row.get('Jumlah warga perempuan desa/kelurahan yang sedang bekerja sebagai Pekerja Migran Indonesia/TKI ', 0)),
                    pub = row.get('Keberadaan pub/diskotek/tempat karaoke yang masih berfungsi di desa/kelurahan', 0), # Ya atau Tidak
                    
                )
                session.add(social)

                #new
                security = Security(
                    village_id=village_id,
                    maintenance = row.get('Pembangunan/pemeliharaan pos keamanan lingkungan', 0), # Ya atau Tidak
                    security_group = row.get('Pembentukan/pengaturan regu keamanan', 0), # Ya atau Tidak
                    pelaporan = row.get('Pelaporan tamu menginap >24 jam ke aparat', 0), # Ya atau Tidak
                    security_system = row.get('Pengaktifan sistem keamanan lingkungan oleh warga', 0), # Ya atau Tidak
                    linmas = parse_int(row.get('Jumlah anggota linmas/hansip', 0)),
                    
                )
                session.add(security)

                #new
                sanitasi = Sanitasi(
                    village_id=village_id,
                    sampah = row.get('Tempat buang sampah sebagian besar keluarga', 0), # 'Dalam lubang atau dibakar langsung', 'Drainase', 'Sungai/Saluran Irigasi', 'Tempat Sampah, kemudian diangkut', 'Lainnya'
                    tiga_r = row.get('Keberadaan TPS3R (Reduce, Reuse, Recycle)', 0), # 'Ada,digunakan', 'Tidak ada'
                    bank_sampah = row.get('Keberadaan bank sampah di desa/kelurahan', 0), # Ada atau Tidak ada
                    pemilahan = row.get('Pemilahan sampah membusuk dan sampah kering', 0), # 'Sebagian besar keluarga','Sebagian kecil keluarga','Semua keluarga','Tidak ada'
                    toilet = row.get('Penggunaan fasilitas buang air besar sebagian besar keluarga', 0), # 'Jamban sendiri'
                    limbah_cair = row.get('Saluran pembuangan limbah cair dari air mandi/cuci Sebagian besar keluarga', 0), # 'Dalam lubang atau tanah terbuka', 'Drainase (got/selokam)', 'Lubang resapan', 'Sungai/saluran irigasi/danau/laut', 'Lainnya'
                    slum = row.get('Keberadaan permukiman kumuh di desa/kelurahan', 0), # 'Ada', 'Tidak ada'
                    pencemaran_air = row.get('Jenis pencemaran lingkungan hidup - Air', 0), # 'Ada', 'Tidak ada'
                    pencemaran_udara = row.get('Jenis pencemaran lingkungan hidup - Udara', 0), # 'Ada', 'Tidak ada'
                    pencemaran_lingkungan = row.get('Jenis pencemaran lingkungan hidup - Tanah', 0), # 'Ada', 'Tidak ada'
                    
                )
                    
                session.add(sanitasi)

                # 12. Criminal
                criminal = Criminal(
                    village_id=village_id,
                    suicide_count_man = parse_int(row.get('Jumlah korban bunuh diri (termasuk percobaan bunuh diri) selama setahun terakhir - laki-laki', 0)),
                    suicide_count_woman = parse_int(row.get('Jumlah korban bunuh diri (termasuk percobaan bunuh diri) selama setahun terakhir - perempuan', 0)),
                    murderer_case_man = parse_int(row.get('Jumlah pembunuhan selama setahun terakhir - laki-laki', 0)),
                    murderer_case_woman = parse_int(row.get('Jumlah pembunuhan selama setahun terakhir - perempuan', 0)),
                )
                session.add(criminal)




                # 10. AI Analysis Placeholder
                ai = AIAnalysis(
                    village_id=village_id,
                    swot_analysis={},
                    persona=None,
                    recommendations={}
                )
                session.add(ai)
                
                count += 1
                if count % 100 == 0:
                    print(f"Processed {count} villages...")
            
            session.commit()
            print(f"Migration complete. {count} villages processed.")

if __name__ == "__main__":
    migrate_data()
