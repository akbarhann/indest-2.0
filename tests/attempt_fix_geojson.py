import json
import os

def attempt_fix():
    file_path = "data/peta_desa_202513524.geojson"
    if not os.path.exists(file_path):
        print("File not found")
        return

    print(f"Reading {file_path}...")
    with open(file_path, "r", encoding="latin-1") as f:
        content = f.read()

    print(f"Content length: {len(content)}")
    
    # Try parsing
    try:
        json.loads(content)
        print("JSON is ALREADY VALID!")
        return
    except json.JSONDecodeError as e:
        print(f"Syntax Error: {e.msg} at pos {e.pos}")
        
        # Strategy: Insert comma
        print("Attempting to insert ',' at error position...")
        fixed_content_1 = content[:e.pos] + "," + content[e.pos:]
        
        try:
            json.loads(fixed_content_1)
            print("SUCCESS! Fixed by inserting comma.")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(fixed_content_1)
            print("File saved with fix.")
            return
        except json.JSONDecodeError as e2:
             print(f"Failed patch 1: {e2.msg} at {e2.pos}")

        # Strategy: Skip character (maybe garbage char)
        print("Attempting to skip 1 char at error position...")
        fixed_content_2 = content[:e.pos] + content[e.pos+1:]
        try:
            json.loads(fixed_content_2)
            print("SUCCESS! Fixed by skipping char.")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(fixed_content_2)
            print("File saved with fix.")
            return
        except json.JSONDecodeError as e3:
            print(f"Failed patch 2: {e3.msg} at {e3.pos}")

    print("Could not auto-fix. Manual intervention required.")

if __name__ == "__main__":
    attempt_fix()
