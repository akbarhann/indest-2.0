from typing import Optional, List, Dict
from beanie import Document
from pydantic import BaseModel, Field
from decimal import Decimal

# --- Embedded Models (formerly Tables) ---

class Health(BaseModel):
    jumlah_rumah_sakit: int = 0
    jumlah_puskesmas: int = 0
    jumlah_klinik: int = 0
    jumlah_faskes_masyarakat: int = 0
    jumlah_farmasi: int = 0
    total_fasilitas_kesehatan: int = 0
    jumlah_dokter: int = 0
    jumlah_bidan: int = 0
    jumlah_tenaga_kesehatan_lain: int = 0
    total_tenaga_kesehatan: int = 0

class Education(BaseModel):
    sd_counts: int = 0
    smp_counts: int = 0
    sma_counts: int = 0
    smk_counts: int = 0
    universities: int = 0
    sd_negeri: int = 0
    sd_swasta: int = 0
    mi_negeri: int = 0
    mi_swasta: int = 0
    smp_negeri: int = 0
    smp_swasta: int = 0
    mts_negeri: int = 0
    mts_swasta: int = 0
    sma_negeri: int = 0
    sma_swasta: int = 0
    ma_negeri: int = 0
    ma_swasta: int = 0
    smk_negeri: int = 0
    smk_swasta: int = 0
    universities_negeri: int = 0
    universities_swasta: int = 0

class Economy(BaseModel):
    primary_income: Optional[str] = None
    markets: int = 0
    banks: int = 0
    cooperatives: int = 0
    bumdes: int = 0
    industries: int = 0
    grocery: int = 0
    eatery: int = 0
    restaurant: int = 0
    supermarket: int = 0
    hotels: int = 0
    bank: int = 0
    non_metallic_mining_industry: int = 0
    paper_and_pulp_industry: int = 0
    printing_industry: int = 0

class Infrastructure(BaseModel):
    electricity: Optional[str] = None
    water_source: Optional[str] = None
    road_condition: Optional[str] = None
    State_electricity_company: int = 0
    Non_state_electricity_company: int = 0
    non_electricity: int = 0
    electricity_source: Optional[str] = None
    rural_solar_street_lights: Optional[str] = None
    rural_main_street_lights: Optional[str] = None
    water_drink_source: Optional[str] = None
    cooking_fuel: Optional[str] = None

class Digital(BaseModel):
    signal_strength: Optional[str] = None
    bts_count: int = 0
    signal_type: Optional[str] = None
    village_information_system: Optional[str] = None

class Disaster(BaseModel):
    drought_cases: int = 0
    flood_cases: int = 0
    landslide_cases: int = 0
    warning_system: Optional[str] = None
    drought_exist: Optional[str] = None
    drought_victim: int = 0
    flood_exist: Optional[str] = None
    flood_victim: int = 0
    landslide_exist: Optional[str] = None
    landslide_victim: int = 0
    sea_waves_exist: Optional[str] = None
    sea_waves_victim: int = 0
    hurricane_exist: Optional[str] = None
    hurricane_victim: int = 0
    earthquake_exist: Optional[str] = None
    earthquake_victim: int = 0
    flash_flood_exist: Optional[str] = None
    flash_flood_victim: int = 0
    tsunami_exist: Optional[str] = None
    tsunami_victim: int = 0
    volcanic_eruption_exist: Optional[str] = None
    volcanic_eruption_victim: int = 0

class Disease(BaseModel):
    muntaber_cases: int = 0
    muntaber_deaths: int = 0
    dbd_cases: int = 0
    dbd_deaths: int = 0
    campak_cases: int = 0
    campak_deaths: int = 0
    malaria_cases: int = 0
    malaria_deaths: int = 0
    sars_cases: int = 0
    sars_deaths: int = 0
    hepatitis_e_cases: int = 0
    hepatitis_e_deaths: int = 0
    difteri_cases: int = 0
    difteri_deaths: int = 0
    covid_cases: int = 0
    covid_deaths: int = 0
    infectious_cases: int = 0
    infectious_deaths: int = 0
    most_cases_disease: Optional[str] = None
    most_deaths_disease: Optional[str] = None
    disability_population: int = 0

class Criminal(BaseModel):
    suicide_count_man: int = 0
    suicide_count_woman: int = 0
    murderer_case_man: int = 0
    murderer_case_woman: int = 0

class AIAnalysis(BaseModel):
    persona: Optional[str] = None
    swot_analysis: Optional[Dict] = Field(default_factory=dict)
    recommendations: Optional[Dict] = Field(default_factory=dict)
    social_capital_narrative: Optional[str] = None
    investment_potential: Optional[str] = None

class Social(BaseModel):
    religion: int = 0
    mosque: int = 0
    musala: int = 0
    church_christian: int = 0
    church_catholic: int = 0
    migran_man: int = 0
    migran_woman: int = 0
    pub: Optional[str] = None

class Security(BaseModel):
    maintenance: Optional[str] = None
    security_group: Optional[str] = None
    pelaporan: Optional[str] = None
    security_system: Optional[str] = None
    linmas: int = 0

class Sanitasi(BaseModel):
    sampah: Optional[str] = None
    tiga_r: Optional[str] = None
    bank_sampah: Optional[str] = None
    pemilahan: Optional[str] = None
    toilet: Optional[str] = None
    limbah_cair: Optional[str] = None
    slum: Optional[str] = None
    pencemaran_air: Optional[str] = None
    pencemaran_udara: Optional[str] = None
    pencemaran_lingkungan: Optional[str] = None


# --- Main Document ---

class Village(Document):
    id: str = Field(primary_key=True) # Custom ID from BPS code
    name: str
    district: str
    latitude: float = 0.0
    longitude: float = 0.0
    topography: Optional[str] = None
    forest_location: Optional[str] = None
    status: Optional[str] = None

    # Embedded Models
    health: Optional[Health] = None
    education: Optional[Education] = None
    economy: Optional[Economy] = None
    infrastructure: Optional[Infrastructure] = None
    digital: Optional[Digital] = None
    disaster: Optional[Disaster] = None
    disease: Optional[Disease] = None
    criminal: Optional[Criminal] = None
    ai_analysis: Optional[AIAnalysis] = None
    social: Optional[Social] = None
    security: Optional[Security] = None
    sanitasi: Optional[Sanitasi] = None

    class Settings:
        name = "villages"

class VillageMacroProjection(BaseModel):
    id: str = Field(alias="_id")
    name: str
    district: str
    latitude: float = 0.0
    longitude: float = 0.0
    topography: Optional[str] = None
    forest_location: Optional[str] = None
    status: Optional[str] = None
    
    # Include all detailed stats needed for macro view calculations
    health: Optional[Health] = None
    education: Optional[Education] = None
    economy: Optional[Economy] = None
    infrastructure: Optional[Infrastructure] = None
    digital: Optional[Digital] = None
    disaster: Optional[Disaster] = None
    disease: Optional[Disease] = None
    criminal: Optional[Criminal] = None
    social: Optional[Social] = None
    security: Optional[Security] = None
    sanitasi: Optional[Sanitasi] = None

    class Settings:
        name = "villages"
        projection = {"ai_analysis": 0}
