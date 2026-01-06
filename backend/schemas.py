from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from decimal import Decimal

from backend.models import (
    HealthBase, EducationBase, EconomyBase, InfrastructureBase, 
    DigitalBase, DisasterBase, DiseaseBase, CriminalBase,
    SocialBase, SecurityBase, SanitasiBase
)

class HealthRadar(BaseModel):
    supply: int
    demand: int
    status: str

class EducationFunnel(BaseModel):
    ratio: float
    status: str

class IndependenceIndex(BaseModel):
    score: float
    grade: str
    details: Dict[str, float]

class VillageMacro(BaseModel):
    id: str
    name: str
    district: str
    latitude: float
    longitude: float
    health_radar: HealthRadar
    education_funnel: EducationFunnel
    # Expanded fields for Macro View filters & charts
    economy: Optional[EconomyBase] = None
    infrastructure: Optional[InfrastructureBase] = None
    digital: Optional[DigitalBase] = None
    disaster: Optional[DisasterBase] = None
    disease: Optional[DiseaseBase] = None
    criminal: Optional[CriminalBase] = None
    social: Optional[SocialBase] = None
    security: Optional[SecurityBase] = None
    sanitasi: Optional[SanitasiBase] = None

    model_config = ConfigDict(from_attributes=True)

class MacroResponse(BaseModel):
    data: List[VillageMacro]

# Micro Schema
class AISwot(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]

class AIInsights(BaseModel):
    swot: AISwot
    persona: str
    local_hero: str
    recommendations: List[str]

from backend.models import (
    HealthBase, EducationBase, EconomyBase, InfrastructureBase, 
    DigitalBase, DisasterBase, DiseaseBase, CriminalBase
)

class VillageMicro(BaseModel):
    id: str
    name: str
    district: str
    status: Optional[str] = None
    topography: Optional[str] = None
    forest_location: Optional[str] = None
    latitude: float
    longitude: float
    demographics: Dict[str, Any] # Population, etc
    stats: Dict[str, Any] # Raw stats for charts
    analytics: Dict[str, Any] # Radar, Funnel, Index
    ai_insights: Optional[AIInsights] = None
    
    # Detailed Nested Data using Base schemas (No relationships)
    health: Optional[HealthBase] = None
    education: Optional[EducationBase] = None
    economy: Optional[EconomyBase] = None
    infrastructure: Optional[InfrastructureBase] = None
    digital: Optional[DigitalBase] = None
    disaster: Optional[DisasterBase] = None
    disease: Optional[DiseaseBase] = None
    criminal: Optional[CriminalBase] = None
    social: Optional[SocialBase] = None
    security: Optional[SecurityBase] = None
    sanitasi: Optional[SanitasiBase] = None

class MicroResponse(BaseModel):
    data: VillageMicro
