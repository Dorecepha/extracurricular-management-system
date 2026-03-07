#!/bin/bash

# Test script for Dashboard V2 API endpoint
# This script tests /api/dashboard/stats-v2 with all three roles

BASE_URL="http://localhost:8080/api"

echo "========================================="
echo "Dashboard V2 API Testing Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test login and get token
test_login() {
    local email=$1
    local password=$2
    local role=$3

    echo -e "${YELLOW}Testing login for $role: $email${NC}"

    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")

    token=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

    if [ -z "$token" ]; then
        echo -e "${RED}❌ Login failed for $role${NC}"
        echo "Response: $response"
        return 1
    fi

    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${token:0:50}..."
    echo "$token"
}

# Function to test dashboard stats-v2
test_dashboard_v2() {
    local token=$1
    local role=$2

    echo ""
    echo -e "${YELLOW}Testing /api/dashboard/stats-v2 for $role${NC}"

    response=$(curl -s -X GET "$BASE_URL/dashboard/stats-v2" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json")

    # Check if response contains error
    if echo "$response" | grep -q "error\|Error\|500\|401\|403"; then
        echo -e "${RED}❌ API call failed${NC}"
        echo "Response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi

    # Check if response has data
    if echo "$response" | grep -q '"statusCode":200'; then
        echo -e "${GREEN}✓ API call successful${NC}"
        echo "Response preview:"
        echo "$response" | jq '.data | keys' 2>/dev/null || echo "$response"

        # Save full response to file
        echo "$response" | jq '.' > "dashboard-v2-${role}.json" 2>/dev/null
        echo "Full response saved to: dashboard-v2-${role}.json"
        return 0
    else
        echo -e "${RED}❌ Unexpected response${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
}

# Test 1: Student Role
echo ""
echo "========================================="
echo "TEST 1: STUDENT ROLE"
echo "========================================="
STUDENT_TOKEN=$(test_login "student@test.com" "password123" "STUDENT")
if [ ! -z "$STUDENT_TOKEN" ]; then
    test_dashboard_v2 "$STUDENT_TOKEN" "student"
fi

# Test 2: Organizer Role
echo ""
echo "========================================="
echo "TEST 2: ORGANIZER ROLE"
echo "========================================="
ORGANIZER_TOKEN=$(test_login "organizer@test.com" "password123" "ORGANIZER")
if [ ! -z "$ORGANIZER_TOKEN" ]; then
    test_dashboard_v2 "$ORGANIZER_TOKEN" "organizer"
fi

# Test 3: Admin Role
echo ""
echo "========================================="
echo "TEST 3: ADMIN ROLE"
echo "========================================="
ADMIN_TOKEN=$(test_login "admin@test.com" "password123" "ADMIN")
if [ ! -z "$ADMIN_TOKEN" ]; then
    test_dashboard_v2 "$ADMIN_TOKEN" "admin"
fi

echo ""
echo "========================================="
echo "Testing Complete"
echo "========================================="
echo ""
echo "NOTE: Update the email/password combinations in this script"
echo "to match actual users in your database."
