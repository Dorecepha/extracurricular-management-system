/**
 * k6 Load Test: Scenario 1 - Single Event Registration
 *
 * Purpose: Test optimistic locking under extreme contention
 * Scenario: 500 students competing for 100 spots in a single event
 *
 * Expected Baseline Results (BEFORE optimization):
 * - Success Rate: ~20% (100/500)
 * - Avg Response Time: ~1,250ms
 * - p95 Response Time: ~2,500ms
 * - HTTP Failures: ~15% (connection pool exhaustion)
 * - Optimistic Lock Errors: ~70
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics';

// ===================================
// Configuration
// ===================================

const API_BASE_URL = 'http://localhost:8080/api';
const TARGET_EVENT_ID = 51; // Event with capacity 100 (first event in test data)

// ===================================
// Load Student Tokens from CSV
// ===================================

const students = new SharedArray('students', function () {
    const data = open('./student_tokens.csv');
    const lines = data.split('\n');
    const students = [];

    // Skip header row (line 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // Skip empty lines

        const parts = line.split(',');
        if (parts.length >= 4) {
            students.push({
                studentNum: parseInt(parts[0]),
                userId: parseInt(parts[1]),
                email: parts[2],
                token: parts[3]
            });
        }
    }

    return students;
});

console.log(`Loaded ${students.length} student tokens from CSV`);

// ===================================
// Test Configuration
// ===================================

export const options = {
    scenarios: {
        single_event_stress: {
            executor: 'shared-iterations',
            vus: 500,           // 500 concurrent virtual users
            iterations: 500,    // Total 500 registration attempts
            maxDuration: '5m',  // Safety timeout
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<3000'], // 95% of requests should complete within 3s
        'http_req_failed': ['rate<0.20'],    // Less than 20% HTTP failures (baseline may exceed this)
    },
};

// ===================================
// Custom Metrics
// ===================================

const registrationSuccess = new Counter('registration_success');
const registrationCapacityFull = new Counter('registration_capacity_full');
const registrationOptimisticLock = new Counter('registration_optimistic_lock');
const registrationConnectionError = new Counter('registration_connection_error');
const registrationOtherError = new Counter('registration_other_error');
const registrationDuration = new Trend('registration_duration');

// ===================================
// Main Test Function
// ===================================

export default function () {
    // Get unique student for this VU
    // With shared-iterations executor, each VU runs exactly once
    // __VU starts from 1, so subtract 1 for zero-based array indexing
    const studentIndex = (__VU - 1) % students.length;
    const student = students[studentIndex];

    // Prepare registration request
    // Note: Event ID is in the path, student is identified from JWT token
    const url = `${API_BASE_URL}/registrations/event/${TARGET_EVENT_ID}`;

    const params = {
        headers: {
            'Authorization': `Bearer ${student.token}`
        },
        timeout: '10s',
    };

    // Send registration request (no request body needed)
    const startTime = Date.now();
    const response = http.post(url, null, params);
    const duration = Date.now() - startTime;

    registrationDuration.add(duration);

    // ===================================
    // Response Analysis
    // ===================================

    const success = check(response, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    if (success) {
        // Successful registration
        registrationSuccess.add(1);
        console.log(`[OK] Student ${student.studentNum} registered successfully (${duration}ms)`);
    } else {
        // Categorize failure reason
        try {
            const body = response.json();
            const message = body.message || body.error || '';

            if (message.toLowerCase().includes('capacity') ||
                message.toLowerCase().includes('full') ||
                message.toLowerCase().includes('no available spots')) {
                registrationCapacityFull.add(1);
                console.log(`[CAPACITY] Student ${student.studentNum} - Event full (${duration}ms)`);
            } else if (message.toLowerCase().includes('optimistic') ||
                       message.toLowerCase().includes('version') ||
                       message.toLowerCase().includes('conflict') ||
                       message.toLowerCase().includes('high traffic')) {
                registrationOptimisticLock.add(1);
                console.log(`[LOCK] Student ${student.studentNum} - Optimistic lock error (${duration}ms)`);
            } else if (response.status === 0 ||
                       response.status >= 500 ||
                       message.toLowerCase().includes('connection') ||
                       message.toLowerCase().includes('timeout')) {
                registrationConnectionError.add(1);
                console.log(`[ERROR] Student ${student.studentNum} - Connection/Server error: ${response.status} (${duration}ms)`);
            } else {
                registrationOtherError.add(1);
                console.log(`[OTHER] Student ${student.studentNum} - ${message.substring(0, 50)} (${duration}ms)`);
            }
        } catch (e) {
            // Response is not JSON or parsing failed
            registrationOtherError.add(1);
            console.log(`[ERROR] Student ${student.studentNum} - Status ${response.status}, non-JSON response (${duration}ms)`);
        }
    }

    // Small delay to avoid overwhelming the server instantly
    sleep(0.1); // 100ms think time
}

// ===================================
// Teardown: Verify Capacity Not Exceeded
// ===================================

export function teardown(data) {
    console.log('\n========================================');
    console.log('POST-TEST VERIFICATION');
    console.log('========================================');

    // Query event to verify capacity wasn't exceeded
    const response = http.get(`${API_BASE_URL}/events/${TARGET_EVENT_ID}`);

    if (response.status === 200) {
        try {
            const event = response.json().data;
            const capacity = event.capacity;
            const registrations = event.currentRegistrations;

            console.log(`Event ID: ${TARGET_EVENT_ID}`);
            console.log(`Capacity: ${capacity}`);
            console.log(`Current Registrations: ${registrations}`);

            if (registrations > capacity) {
                console.log(`\n❌ CRITICAL ERROR: Capacity exceeded! (${registrations}/${capacity})`);
                console.log('Optimistic locking FAILED - investigate immediately!');
            } else if (registrations === capacity) {
                console.log(`\n✅ Event FULL: Capacity reached exactly (${registrations}/${capacity})`);
            } else {
                console.log(`\n✅ Capacity OK: ${registrations}/${capacity} spots filled`);
            }
        } catch (e) {
            console.log(`\n⚠️  Could not parse event response: ${e}`);
        }
    } else {
        console.log(`\n⚠️  Could not retrieve event (status ${response.status})`);
    }

    console.log('========================================\n');
}
