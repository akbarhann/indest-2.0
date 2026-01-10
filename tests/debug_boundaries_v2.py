import sys
import os
import json

def debug_boundaries_advanced():
    file_path = os.path.join(os.getcwd(), "data", "peta_desa_202513524.geojson")
    if not os.path.exists(file_path):
         file_path = os.path.join(os.getcwd(), "..", "data", "peta_desa_202513524.geojson")
    
    print(f"Reading: {file_path}")
    
    # helper to print context
    def print_context(text, index):
        start = max(0, index - 50)
        end = min(len(text), index + 50)
        print(f"Error context at {index}:")
        print(f"...{text[start:end]}...")

    content = ""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            json.loads(content)
            print("Valid JSON (UTF-8)")
    except UnicodeDecodeError as e:
        print(f"UTF-8 Decode Error: {e}")
    except json.JSONDecodeError as e:
        print(f"JSON Error (UTF-8): {e}")
        print_context(content, e.pos)

    try:
        with open(file_path, "r", encoding="latin-1") as f:
            content = f.read()
            json.loads(content)
            print("Valid JSON (latin-1)")
    except json.JSONDecodeError as e:
        print(f"JSON Error (latin-1): {e}")
        print_context(content, e.pos)

if __name__ == "__main__":
    debug_boundaries_advanced()
