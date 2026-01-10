import json
import os
import asyncio
import sys

# Add parent dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db
from backend.models import Village

def inspect_geojson_structure():
    file_path = "data/peta_desa_202513524.geojson"
    print(f"\n--- 1. GEOJSON INSPECTION ({file_path}) ---")
    if not os.path.exists(file_path):
        print("File not found")
        return

    try:
        with open(file_path, "r", encoding="latin-1") as f:
            data = json.load(f)
            print(f"Data Type: {type(data)}")
            if isinstance(data, dict):
                print(f"Keys: {list(data.keys())}")
                if "features" in data:
                    print(f"Features count: {len(data['features'])}")
                    if len(data['features']) > 0:
                        print(f"First feature keys: {data['features'][0].keys()}")
                        print(f"First feature properties: {data['features'][0].get('properties')}")
                else:
                    print("CRITICAL: 'features' key missing!")
            else:
                print("CRITICAL: Root is not a dict!")
    except Exception as e:
        print(f"Error reading: {e}")

async def inspect_db_data():
    print("\n--- 2. DB DATA INSPECTION ---")
    await init_db()
    
    # Check TLOGOAGUNG (from previous logs) or any village
    # Let's just find one with non-zero disability
    villages = await Village.find_all().to_list()
    
    total_disability = 0
    non_zero_count = 0
    
    for v in villages:
        disability = v.disease.disability_population if v.disease else 0
        total_disability += disability
        if disability > 0:
            non_zero_count += 1
            if non_zero_count <= 3:
                print(f"Village {v.name}: Disability = {disability}")
    
    print(f"\nTotal Villages: {len(villages)}")
    print(f"Villages with >0 Disability: {non_zero_count}")
    print(f"Total Disability Population: {total_disability}")

if __name__ == "__main__":
    inspect_geojson_structure()
    asyncio.run(inspect_db_data())
