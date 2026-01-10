import sys
import os
import json

# Add parent dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def debug_boundaries():
    print(f"CWD: {os.getcwd()}")
    
    # Replicate logic from backend/main.py
    file_path = os.path.join(os.getcwd(), "data", "peta_desa_202513524.geojson")
    if not os.path.exists(file_path):
         file_path = os.path.join(os.getcwd(), "..", "data", "peta_desa_202513524.geojson")
    
    print(f"Target File: {file_path}")
    print(f"Exists? {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        print("File NOT found.")
        return

    print("Attempting to load...")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            print("Success with UTF-8")
    except UnicodeDecodeError:
        print("UnicodeDecodeError! Retrying with latin-1")
        try:
            with open(file_path, "r", encoding="latin-1") as f:
                data = json.load(f)
                print("Success with latin-1")
        except Exception as e:
            print(f"Fallback failed: {e}")
    except Exception as e:
        print(f"Primary load failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_boundaries()
