import asyncio
import sys
import os

# Add parent dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db
from backend.main import get_macro_data, get_micro_data, get_nearest_village

async def verify_endpoints():
    print("Initializing Database...")
    await init_db()
    
    print("\n--- Testing Macro Endpoint ---")
    try:
        macro = await get_macro_data()
        print(f"Macro Data Length: {len(macro.data)} villages")
        if len(macro.data) > 0:
            print(f"Sample Village: {macro.data[0].name}")
    except Exception as e:
        print(f"FAILED Macro: {e}")
        import traceback
        traceback.print_exc()

    print("\n--- Testing Micro Endpoint (ID: 3524010001) ---")
    try:
        micro = await get_micro_data("3524010001")
        print(f"Village Name: {micro.data.name}")
        print(f"Doctors: {micro.data.stats['doctors']}")
        print(f"Status: {micro.data.analytics['health_radar']['status']}")
    except Exception as e:
        print(f"FAILED Micro: {e}")
        import traceback
        traceback.print_exc()

    print("\n--- Testing Nearest Village Endpoint ---")
    try:
        # Some coordinate in Lamongan
        # Lat -7.1, Long 112.4
        nearest = await get_nearest_village(-7.1, 112.4)
        print(f"Nearest: {nearest}")
    except Exception as e:
        print(f"FAILED Nearest: {e}")
        import traceback
        traceback.print_exc()

    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(verify_endpoints())
