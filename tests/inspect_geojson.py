import os

def inspect_error():
    file_path = "data/peta_desa_202513524.geojson"
    offset = 172031
    context = 100
    
    if not os.path.exists(file_path):
        print("File not found")
        return

    try:
        with open(file_path, "r", encoding="latin-1") as f:
            f.seek(max(0, offset - context))
            data = f.read(context * 2)
            print(f"--- Context around {offset} (latin-1) ---")
            print(data)
            print("-" * 30)
            
            # Highlight position
            relative_pos = min(offset, context)
            pointer = " " * relative_pos + "^ HERE"
            print(pointer)
            
    except Exception as e:
        print(f"Error reading: {e}")

if __name__ == "__main__":
    inspect_error()
