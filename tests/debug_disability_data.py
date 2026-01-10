import csv
import os

def debug_csv():
    file_path = os.path.join(os.getcwd(), "data", "podes_dashboard_data.csv")
    if not os.path.exists(file_path):
        print("CSV not found!")
        return

    # Columns we are trying to sum
    target_columns = [
        'Jumlah penyandang tuna netra (buta)',
        'Jumlah penyandang tuna rungu (tuli)',
        'Jumlah penyandang tuna wicara (bisu)',
        'Jumlah penyandang tuna rungu-wicara (tuli-bisu)',
        'Jumlah penyandang tuna daksa (disabilitas tubuh) : kelumpuhan/kelainan/ketidaklengkapan anggota gerak',
        'Jumlah penyandang tuna grahita (keterbelakangan mental)',
        'Jumlah penyandang tuna laras (eks-sakit jiwa, mengalami hambatan/gangguan dalam mengendalikan emosi dan kontrol sosial)',
        'Jumlah penyandang tuna eks-sakit kusta : pernah mengalami sakit kusta dan telah dinyatakan sembuh oleh dokter',
        'Jumlah penyandang tuna ganda (fisik-mental): fisik(buta, tuli, bisu, bisu-tuli atau tubuh) dan mental (tunagrahita atau tunalaras)'
    ]

    print(f"Reading {file_path}...")
    with open(file_path, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        headers = reader.fieldnames
        
        # 1. Check if headers exist
        print("\n--- Header Check ---")
        missing = []
        for t in target_columns:
            if t not in headers:
                missing.append(t)
                print(f"[MISSING] {t}")
            else:
                print(f"[OK] {t}")
        
        if missing:
            print(f"\nCRITICAL: {len(missing)} columns are missing/mismatched!")
            # Try to find close matches for the first missing one
            print("Possible close matches in CSV:")
            for h in headers:
                if 'tuna' in h.lower() or 'jumlah penyandang' in h.lower():
                    print(f"  - {h}")
            return

        # 2. Check Data Values
        print("\n--- Data Value Check (First 5 Rows) ---")
        for i, row in enumerate(reader):
            if i >= 5: break
            
            total = 0
            print(f"Row {i+1} ({row.get('NAMA_DESA', 'Unknown')}):")
            for col in target_columns:
                val_str = row.get(col, '0')
                try:
                    val = float(val_str) if val_str else 0
                except:
                    val = 0
                total += val
                if val > 0:
                    print(f"  - {col}: {val}")
            
            print(f"  => Calculated Total: {total}")

if __name__ == "__main__":
    debug_csv()
