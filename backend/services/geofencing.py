import json
import os
from shapely.geometry import shape, Point
from typing import Optional, Dict

class GeofenceService:
    """
    Service to handle polygon-based spatial lookups to identify 
    the village containing a specific geographic point.
    """
    _instance = None
    _features = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeofenceService, cls).__new__(cls)
            cls._instance._load_geojson()
        return cls._instance

    def _load_geojson(self):
        # Path relative to project root (usually where main.py runs)
        # Assuming the backend is run from d:\BPS LA\indest
        file_path = os.path.join(os.getcwd(), "data", "peta_desa_202513524.geojson")
        
        # Fallback if running from backend folder
        if not os.path.exists(file_path):
            file_path = os.path.join(os.getcwd(), "..", "data", "peta_desa_202513524.geojson")

        if not os.path.exists(file_path):
            print(f"Warning: GeoJSON file not found at {file_path}")
            return

        print(f"Loading Village Boundaries from {file_path}...")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for feature in data.get("features", []):
                    try:
                        # iddesa matches the village ID in our database
                        geom = shape(feature["geometry"])
                        props = feature["properties"]
                        self._features.append({
                            "geometry": geom,
                            "id": props.get("iddesa"),
                            "name": props.get("nmdesa")
                        })
                    except Exception as e:
                        print(f"Error parsing feature for village {feature.get('properties', {}).get('nmdesa')}: {e}")
            print(f"Successfully loaded {len(self._features)} village boundaries.")
        except Exception as e:
            print(f"Error loading GeoJSON: {e}")

    def find_village(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Detect if a point (lat, lon) falls within any defined village polygon.
        """
        # Note: GeoJSON and Shapely use (Longitude, Latitude) order for Points
        point = Point(lon, lat)
        for feature in self._features:
            if feature["geometry"].contains(point):
                return {
                    "id": feature["id"],
                    "name": feature["name"]
                }
        return None

    def find_nearest_polygon(self, lat: float, lon: float, max_distance_deg: float = 0.005) -> Optional[Dict]:
        """
        Finds the nearest village polygon to the point, even if not inside.
        max_distance_deg: ~0.005 deg is roughly 500m.
        """
        point = Point(lon, lat)
        nearest_feature = None
        min_dist = float('inf')

        for feature in self._features:
            # shapely.distance returns Euclidean distance in degrees (approx)
            dist = feature["geometry"].distance(point)
            if dist < min_dist:
                min_dist = dist
                nearest_feature = feature
                
        if nearest_feature and min_dist <= max_distance_deg:
             return {
                "id": nearest_feature["id"],
                "name": nearest_feature["name"],
                "distance_approx_m": int(min_dist * 111320) # Rough conversion to meters
            }
        return None

# Singleton instance
geofence_service = GeofenceService()
