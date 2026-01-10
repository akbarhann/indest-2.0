import asyncio
import sys
import os
import requests

def verify_boundaries_http():
    # Attempt to hit the endpoint running on localhost:8000
    try:
        print("Testing http://127.0.0.1:8000/api/boundaries...")
        response = requests.get("http://127.0.0.1:8000/api/boundaries")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Loaded {len(data.get('features', []))} features.")
            print(f"First feature: {data.get('features', [])[0].get('properties', {}).get('nmdesa')}")
        else:
            print("Failed with status code.")
            print(response.text[:200])
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    verify_boundaries_http()
