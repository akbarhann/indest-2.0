import requests
import json
import sys

try:
    # 1. Check Gzip
    headers = {"Accept-Encoding": "gzip"}
    r = requests.get('http://localhost:8000/api/macro', headers=headers)
    print(f"Status Code: {r.status_code}")
    print(f"Content-Encoding: {r.headers.get('Content-Encoding')}")
    print(f"Content-Length: {r.headers.get('Content-Length')}")
    
    # 2. Check Data Projection
    data = r.json()
    if "data" in data and len(data["data"]) > 0:
        first_item = data["data"][0]
        if "ai_analysis" in first_item:
            print("FAIL: ai_analysis field is STILL present.")
        else:
            print("PASS: ai_analysis field is successfully REMOVED.")
        
        # Print a sample size
        print(f"Sample Item Keys: {list(first_item.keys())}")
    else:
        print("FAIL: No data returned")

except Exception as e:
    print(f"Error: {e}")
