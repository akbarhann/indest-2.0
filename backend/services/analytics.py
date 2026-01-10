from decimal import Decimal
from typing import List, Dict, Optional
# import numpy as np         # REMOVED for Vercel optimization
# import pandas as pd        # REMOVED for Vercel optimization
# from sklearn.cluster import KMeans             # REMOVED 
# from sklearn.preprocessing import LabelEncoder # REMOVED 
from backend.models import Village, Health, Education, Economy, Infrastructure, Digital, Disaster

class ScoringAlgorithm:
    @staticmethod
    def calculate_health_radar(village: Village) -> Dict:
        if not village.health:
            return {"supply": 0, "demand": 0, "status": "Unknown"}

        h = village.health
        # Use detailed fields with null protection
        supply = ((h.jumlah_dokter or 0) * 3) + ((h.jumlah_bidan or 0) * 1) + ((h.jumlah_puskesmas or 0) * 5)
        
        # Demand: Use Disease data if available
        demand = 0
        if village.disease:
            # Use aggregated infectious cases as proxy for demand
            demand = (village.disease.infectious_cases or 0)
        
        status = "High Risk" if demand > supply else "Safe"
        return {
            "supply": int(supply), 
            "demand": int(demand), 
            "status": status
        }

    @staticmethod
    def calculate_education_funnel(village: Village) -> Dict:
        if not village.education:
            return {"ratio": 0.0, "status": "Unknown"}
            
        e = village.education
        sd = e.sd_counts or 0
        if sd == 0:
            return {"ratio": 0.0, "status": "Dropout Risk Zone"} # Assume risk if no SD
            
        ratio = ((e.smp_counts or 0) + (e.sma_counts or 0)) / sd
        status = "Dropout Risk Zone" if ratio < 0.2 else "Stable"
        
        return {
            "ratio": float(round(ratio, 2)), 
            "status": status
        }

    @staticmethod
    def calculate_independence_index(village: Village) -> Dict:
        # Weights: Digital 33%, Living 33%, Economy 33%
        if not village.digital or not village.infrastructure or not village.economy:
             return {
                 "score": 0.0, 
                 "grade": "Incomplete Data",
                 "details": {"digital": 0.0, "living": 0.0, "economy": 0.0}
             }

        # Digital Score (0-100)
        d = village.digital
        sig_str = (d.signal_strength or "").lower()
        
        sig_score = 100 if "kuat" in sig_str else (50 if "lemah" in sig_str else 0)
        bts_score = min((d.bts_count or 0) * 20, 100) # Cap at 5 BTS
        
        digital_idx = (sig_score + bts_score) / 2

        # Living Score (0-100)
        i = village.infrastructure
        water_str = (i.water_source or i.water_drink_source or "").lower()
        elec_str = (i.electricity or i.electricity_source or "").lower()
        fuel_str = (i.cooking_fuel or "").lower()
        
        water_score = 100 if any(k in water_str for k in ["leding", "pompa", "bor"]) else 50
        elec_score = 100 if "pln" in elec_str else 0
        fuel_score = 100 if any(k in fuel_str for k in ["gas", "listrik"]) else 50
        
        living_idx = (water_score + elec_score + fuel_score) / 3

        # Economy Score (0-100)
        e = village.economy
        mkt_score = min((e.markets or 0) * 20, 100)
        bank_score = min(((e.banks or 0) + (e.bank or 0)) * 50, 100) # Check both fields if ambiguity exists
        coop_score = min((e.cooperatives or 0) * 20, 100)
        bumdes_score = min((e.bumdes or 0) * 50, 100)
        economy_idx = (mkt_score + bank_score + coop_score + bumdes_score) / 4

        total_score = (digital_idx + living_idx + economy_idx) / 3
        
        grade = "Maju" if total_score > 80 else ("Berkembang" if total_score > 50 else "Tertinggal")
        
        return {
            "score": float(round(total_score, 2)), 
            "grade": grade,
            "details": {
                "digital": float(round(digital_idx, 2)),
                "living": float(round(living_idx, 2)),
                "economy": float(round(economy_idx, 2))
            }
        }

class ClusteringService:
    def __init__(self, n_clusters=5):
        pass # Disabled to save space

    def train_model(self, villages: List[Village]):
        pass # Disabled

    def predict_persona(self, village: Village) -> str:
        # Static fallback without AI
        return "Uncategorized (AI Disabled)"
