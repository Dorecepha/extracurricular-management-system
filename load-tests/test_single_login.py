#!/usr/bin/env python3
import requests
import sys

print("Testing single login...")
print("Backend health check...")

try:
    response = requests.get("http://localhost:8080/actuator/health", timeout=15)
    print(f"Health check status: {response.status_code}")
    if response.status_code == 200:
        print("[OK] Backend is healthy")
    else:
        print(f"[ERROR] Backend returned {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Health check failed: {e}")
    sys.exit(1)

print("\nTesting login for student1...")
try:
    response = requests.post(
        "http://localhost:8080/api/auth/login",
        json={"email": "student1@university.edu", "password": "password123"},
        timeout=10
    )
    print(f"Login status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("[OK] Login successful")
        print(f"Token: {data.get('data', {}).get('token', 'N/A')[:50]}...")
        print(f"User ID: {data.get('data', {}).get('id', 'N/A')}")
    else:
        print(f"[ERROR] Login failed: {response.text}")

except Exception as e:
    print(f"[ERROR] Login request failed: {e}")

print("\nTest complete!")
