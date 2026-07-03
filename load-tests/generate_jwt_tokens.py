#!/usr/bin/env python3
"""
Generate JWT tokens for all test students by calling the /api/auth/login endpoint
Outputs: student_tokens.csv (ready for k6 consumption)
"""
import requests
import csv
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
API_BASE_URL = "http://localhost:8080/api/auth"
NUM_STUDENTS = 10000
PASSWORD = "password123"
OUTPUT_CSV = "student_tokens.csv"
BATCH_SIZE = 100  # Process 100 students at a time
MAX_WORKERS = 10  # Parallel requests

def login_student(student_num):
    """Login a single student and return token"""
    email = f"student{student_num}@university.edu"

    try:
        response = requests.post(
            f"{API_BASE_URL}/login",
            json={"email": email, "password": PASSWORD},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            # Response format: {"statusCode": 200, "message": "...", "data": {"token": "...", "id": ..., ...}}
            response_data = data.get("data", {})
            token = response_data.get("token")
            user_id = response_data.get("id")  # This is userID in camelCase

            if token:
                return {
                    "student_num": student_num,
                    "user_id": user_id,
                    "email": email,
                    "token": token,
                    "status": "SUCCESS"
                }
            else:
                return {"student_num": student_num, "email": email, "status": "NO_TOKEN", "error": str(data)}
        else:
            return {
                "student_num": student_num,
                "email": email,
                "status": "HTTP_ERROR",
                "error": f"Status {response.status_code}: {response.text[:100]}"
            }

    except Exception as e:
        return {
            "student_num": student_num,
            "email": email,
            "status": "EXCEPTION",
            "error": str(e)
        }

def generate_tokens_parallel():
    """Generate tokens for all students using thread pool"""
    results = []
    failed = []

    print(f"Generating JWT tokens for {NUM_STUDENTS} students...")
    print(f"API: {API_BASE_URL}/login")
    print(f"Workers: {MAX_WORKERS} parallel requests")
    print("-" * 60)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        futures = {executor.submit(login_student, i): i for i in range(1, NUM_STUDENTS + 1)}

        # Process completed tasks
        completed = 0
        for future in as_completed(futures):
            result = future.result()
            completed += 1

            if result["status"] == "SUCCESS":
                results.append(result)
                if completed % 100 == 0:
                    print(f"[OK] {completed}/{NUM_STUDENTS} ({len(results)} successful, {len(failed)} failed)")
            else:
                failed.append(result)
                print(f"[ERROR] Failed: {result['email']} - {result.get('error', 'Unknown error')}")

    print("-" * 60)
    print(f"[OK] Successfully generated {len(results)} tokens")
    print(f"[ERROR] Failed: {len(failed)} students")

    return results, failed

def save_to_csv(results, filename):
    """Save results to CSV for k6 consumption"""
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        # Header row (k6 will read this)
        writer.writerow(["student_num", "user_id", "email", "token"])

        for result in results:
            writer.writerow([
                result["student_num"],
                result["user_id"],
                result["email"],
                result["token"]
            ])

    print(f"\n[OK] Saved tokens to: {filename}")
    print(f"  Format: student_num,user_id,email,token")
    print(f"  Rows: {len(results) + 1} (including header)")

def verify_token_sample(results):
    """Test a sample token to verify it works"""
    if not results:
        print("\n[ERROR] No tokens to verify")
        return

    sample = results[0]
    print(f"\nVerifying sample token for {sample['email']}...")

    try:
        response = requests.get(
            "http://localhost:8080/api/events",
            headers={"Authorization": f"Bearer {sample['token']}"},
            timeout=10
        )

        if response.status_code == 200:
            print(f"[OK] Token verified successfully!")
            print(f"  Token length: {len(sample['token'])} characters")
            print(f"  Token preview: {sample['token'][:50]}...")
        else:
            print(f"[ERROR] Token verification failed: Status {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Token verification error: {e}")

if __name__ == "__main__":
    import sys

    # Check if backend is running
    try:
        response = requests.get("http://localhost:8080/actuator/health", timeout=15)
        if response.status_code != 200:
            print("[ERROR] Backend is not running or not healthy")
            print(f"  Start backend: cd backend && mvn spring-boot:run")
            sys.exit(1)
    except requests.exceptions.RequestException as e:
        print("[ERROR] Cannot connect to backend at http://localhost:8080")
        print(f"  Error: {e}")
        print(f"  Start backend: cd backend && mvn spring-boot:run")
        sys.exit(1)

    print("[OK] Backend is running")
    print()

    # Generate tokens
    start_time = time.time()
    results, failed = generate_tokens_parallel()
    duration = time.time() - start_time

    # Save to CSV
    if results:
        save_to_csv(results, OUTPUT_CSV)
        verify_token_sample(results)

    # Summary
    print("\n" + "=" * 60)
    print(f"SUMMARY")
    print("=" * 60)
    print(f"Total students: {NUM_STUDENTS}")
    print(f"Successful: {len(results)} ({len(results) / NUM_STUDENTS * 100:.1f}%)")
    print(f"Failed: {len(failed)} ({len(failed) / NUM_STUDENTS * 100:.1f}%)")
    print(f"Duration: {duration:.1f} seconds ({NUM_STUDENTS / duration:.1f} tokens/sec)")
    print(f"Output: {OUTPUT_CSV}")

    if failed:
        print(f"\n[ERROR] Failed students (first 10):")
        for result in failed[:10]:
            print(f"  - {result['email']}: {result.get('error', 'Unknown')}")

        # Save failed list
        with open("failed_logins.txt", "w") as f:
            for result in failed:
                f.write(f"{result['email']}: {result.get('error', 'Unknown')}\n")
        print(f"\nFull failure list saved to: failed_logins.txt")
