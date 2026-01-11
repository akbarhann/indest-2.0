from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from decimal import Decimal

from backend.models import (
    Health, Education, Economy, Infrastructure, 
    Digital, Disaster, Disease, Criminal,
    Social, Security, Sanitasi
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
    topography: Optional[str] = None
    health_radar: HealthRadar
    education_funnel: EducationFunnel
    # Expanded fields for Macro View filters & charts
    economy: Optional[Economy] = None
    infrastructure: Optional[Infrastructure] = None
    digital: Optional[Digital] = None
    disaster: Optional[Disaster] = None
    disease: Optional[Disease] = None
    criminal: Optional[Criminal] = None
    social: Optional[Social] = None
    security: Optional[Security] = None
    sanitasi: Optional[Sanitasi] = None

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
    Health, Education, Economy, Infrastructure, 
    Digital, Disaster, Disease, Criminal
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

class MicroResponse(BaseModel):
    data: VillageMicro
