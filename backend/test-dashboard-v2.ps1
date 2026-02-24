# PowerShell script to test Dashboard V2 API endpoint
# This script tests /api/dashboard/stats-v2 with all three roles

$BASE_URL = "http://localhost:8080/api"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Dashboard V2 API Testing Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to test login and get token
function Test-Login {
    param(
        [string]$Email,
        [string]$Password,
        [string]$Role
    )

    Write-Host "Testing login for $Role : $Email" -ForegroundColor Yellow

    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body

        if ($response.data.token) {
            Write-Host "✓ Login successful" -ForegroundColor Green
            Write-Host "Token: $($response.data.token.Substring(0, 50))..." -ForegroundColor Gray
            return $response.data.token
        } else {
            Write-Host "❌ Login failed - no token in response" -ForegroundColor Red
            Write-Host ($response | ConvertTo-Json -Depth 10)
            return $null
        }
    } catch {
        Write-Host "❌ Login failed for $Role" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $null
    }
}

# Function to test dashboard stats-v2
function Test-DashboardV2 {
    param(
        [string]$Token,
        [string]$Role
    )

    Write-Host ""
    Write-Host "Testing /api/dashboard/stats-v2 for $Role" -ForegroundColor Yellow

    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        }

        $response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/stats-v2" `
            -Method Get `
            -Headers $headers

        if ($response.statusCode -eq 200) {
            Write-Host "✓ API call successful" -ForegroundColor Green
            Write-Host "Response preview:" -ForegroundColor Gray
            Write-Host ($response.data | ConvertTo-Json -Depth 2)

            # Save full response to file
            $filename = "dashboard-v2-$Role.json"
            $response | ConvertTo-Json -Depth 10 | Out-File $filename
            Write-Host "Full response saved to: $filename" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "❌ Unexpected status code: $($response.statusCode)" -ForegroundColor Red
            Write-Host ($response | ConvertTo-Json -Depth 10)
            return $false
        }
    } catch {
        Write-Host "❌ API call failed" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Error details:" -ForegroundColor Red
            Write-Host $_.ErrorDetails.Message
        }
        return $false
    }
}

# Test 1: Student Role
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TEST 1: STUDENT ROLE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$studentToken = Test-Login -Email "student@test.com" -Password "password123" -Role "STUDENT"
if ($studentToken) {
    Test-DashboardV2 -Token $studentToken -Role "student"
}

# Test 2: Organizer Role
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TEST 2: ORGANIZER ROLE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$organizerToken = Test-Login -Email "organizer@test.com" -Password "password123" -Role "ORGANIZER"
if ($organizerToken) {
    Test-DashboardV2 -Token $organizerToken -Role "organizer"
}

# Test 3: Admin Role
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TEST 3: ADMIN ROLE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$adminToken = Test-Login -Email "admin@test.com" -Password "password123" -Role "ADMIN"
if ($adminToken) {
    Test-DashboardV2 -Token $adminToken -Role "admin"
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: Update the email/password combinations in this script" -ForegroundColor Yellow
Write-Host "to match actual users in your database." -ForegroundColor Yellow
