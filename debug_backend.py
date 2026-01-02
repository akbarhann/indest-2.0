from backend.models import Village, Health
from backend.schemas import VillageMicro
from sqlmodel import create_engine, Session, SQLModel
import json

# Minimal reproduction of serialization
def test_serialization():
    try:
        # Mock objects
        v_id = "1101012001"
        h = Health(village_id=v_id, doctors=5)
        # Note: In a real DB session, relationships might be loaded or not.
        # If we just instantiate Health, village is None by default unless set.
        
        # However, FastAPI/Pydantic validation might inspect the type definition and fail due to infinite recursion in definition alone, 
        # or it might fail during runtime if it tries to follow the type.
        
        print("Import successful. Trying schema validation...")
        
        # Test schema definition validity (Pydantic often fails at definition time for loops if not handled)
        
        print("Schema seems defined. Creating instance...")
        # Create a dummy structure with circular ref
        # Note: VillageMicro now uses HealthBase, which does NOT have 'village' field.
        # So passing 'h' (Health) into 'health' (HealthBase) should work and ignore 'h.village'.
        vm = VillageMicro(
            id=v_id,
            name="Test Village",
            district="Test District",
            latitude=0.0,
            longitude=0.0,
            demographics={},
            stats={},
            analytics={},
            health=h
        )
        
        print("Instance created successfully.")
        print(vm.model_dump_json())
        
    except Exception as e:
        print(f"Caught error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_serialization()
