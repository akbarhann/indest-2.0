from decimal import Decimal
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder
from backend.models import Village, Health, Education, Economy, Infrastructure, Digital, Disaster

class ScoringAlgorithm:
    @staticmethod
    def calculate_health_radar(village: Village) -> Dict:
        if not village.health:
            return {"supply": 0, "demand": 0, "status": "Unknown"}

        h = village.health
        # Use detailed fields
        supply = (h.jumlah_dokter * 3) + (h.jumlah_bidan * 1) + (h.jumlah_puskesmas * 5)
        
        # Demand: Use Disease data if available
        demand = 0
        if village.disease:
            # Use aggregated infectious cases as proxy for demand
            demand = village.disease.infectious_cases
        
        status = "High Risk" if demand > supply else "Safe"
        return {
            "supply": supply, 
            "demand": demand, 
            "status": status
        }

    @staticmethod
    def calculate_education_funnel(village: Village) -> Dict:
        if not village.education:
            return {"ratio": 0.0, "status": "Unknown"}
            
        e = village.education
        sd = e.sd_counts
        if sd == 0:
            return {"ratio": 0.0, "status": "Dropout Risk Zone"} # Assume risk if no SD
            
        ratio = (e.smp_counts + e.sma_counts) / sd
        status = "Dropout Risk Zone" if ratio < 0.2 else "Stable"
        
        return {
            "ratio": float(round(ratio, 2)), 
            "status": status
        }

    @staticmethod
    def calculate_independence_index(village: Village) -> Dict:
        # Weights: Digital 33%, Living 33%, Economy 33%
        if not village.digital or not village.infrastructure or not village.economy:
             return {"score": 0, "grade": "Unknown"}

        # Digital Score (0-100)
        d = village.digital
        # Use safe string access (col or "") in case of None
        sig_str = (d.signal_strength or "").lower()
        # net_str removed as per schema change
        
        sig_score = 100 if "kuat" in sig_str else (50 if "lemah" in sig_str else 0)
        # Removed internet score component
        bts_score = min(d.bts_count * 20, 100) # Cap at 5 BTS
        
        digital_idx = (sig_score + bts_score) / 2 # Averaged over 2 factors now

        # Living Score (0-100)
        i = village.infrastructure
        water_str = (i.water_source or "").lower()
        elec_str = (i.electricity or "").lower()
        fuel_str = (i.cooking_fuel or "").lower()
        
        water_score = 100 if "leding" in water_str or "pompa" in water_str else 50
        elec_score = 100 if "pln" in elec_str else 0
        fuel_score = 100 if "gas" in fuel_str or "listrik" in fuel_str else 50
        
        living_idx = (water_score + elec_score + fuel_score) / 3

        # Economy Score (0-100)
        e = village.economy
        mkt_score = min(e.markets * 20, 100)
        bank_score = min(e.banks * 50, 100)
        coop_score = min(e.cooperatives * 20, 100)
        bumdes_score = min(e.bumdes * 50, 100)
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
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters, random_state=42)
        self.encoders = {
            'topography': LabelEncoder(),
            'primary_income': LabelEncoder(),
            'signal_strength': LabelEncoder()
        }
        self.cluster_labels = {
            0: "Agropolitan",
            1: "Industrial Zone",
            2: "Coastal Trade Hub",
            3: "Digital Service Center",
            4: "Tourism Potential"
        } # Placeholder names, typically mapped after analysis

    def _prepare_data(self, villages: List[Village]) -> pd.DataFrame:
        data = []
        for v in villages:
            row = {
                'topography': v.topography or 'Unknown',
                'primary_income': v.economy.primary_income if v.economy else 'Unknown',
                'signal_strength': v.digital.signal_strength if v.digital else 'Unknown',
                'markets': v.economy.markets if v.economy else 0,
                'industries': v.economy.industries if v.economy else 0 # Ensure this field exists or verify models
            }
            data.append(row)
        return pd.DataFrame(data)

    def train_model(self, villages: List[Village]):
        df = self._prepare_data(villages)
        
        # Fit encoders
        for col, encoder in self.encoders.items():
            df[col] = encoder.fit_transform(df[col].astype(str))
            
        X = df[['topography', 'primary_income', 'signal_strength', 'markets', 'industries']]
        self.model.fit(X)
        return self.model.labels_

    def predict_persona(self, village: Village) -> str:
        # Need to handle single prediction with existing encoders
        # Note: In production, encoders should be saved/loaded. 
        # Here we assume training happened or handle gracefully.
        try:
            df = self._prepare_data([village])
            for col, encoder in self.encoders.items():
                # Handle unseen labels strictly or leniently? 
                # For demo, define fallback or re-fit (bad for single pred).
                # Ideally, fit once on all data.
                if hasattr(encoder, 'classes_'):
                     # Simple unseen handling: assign mostly frequent or 0
                     # Check if label exists
                     val = df[col].iloc[0]
                     if val in encoder.classes_:
                         df[col] = encoder.transform([val])
                     else:
                         df[col] = 0 # Fallback
            
            X = df[['topography', 'primary_income', 'signal_strength', 'markets', 'industries']]
            cluster_id = self.model.predict(X)[0]
            return self.cluster_labels.get(cluster_id, f"Cluster {cluster_id}")
        except Exception as e:
            return "Uncategorized"
