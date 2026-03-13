/**
 * k6 Load Test: Scenario 2 - Distributed Load
 *
 * Purpose: Test realistic distributed load across multiple events
 * Scenario: 500 concurrent users registering for 50 different events
 *
 * Expected Baseline Results (BEFORE optimization):
 * - Success Rate: ~82.5%
 * - Connection Errors: ~95
 * - Avg Response Time: ~850ms
 * - p95 Response Time: ~1,800ms
 * - p99 Response Time: ~5,200ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics';

// ===================================
// Configuration
// ===================================

const API_BASE_URL = 'http://localhost:8080/api';

// Target first 50 events (IDs 1-50)
// These are seminar events with capacity 50 each
const TARGET_EVENT_IDS = Array.from({ length: 50 }, (_, i) => i + 1);

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
console.log(`Targeting ${TARGET_EVENT_IDS.length} events (IDs ${TARGET_EVENT_IDS[0]}-${TARGET_EVENT_IDS[TARGET_EVENT_IDS.length - 1]})`);

// ===================================
// Test Configuration
// ===================================

export const options = {
    scenarios: {
        distributed_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 100 },  // Ramp up to 100 users
                { duration: '1m', target: 300 },   // Ramp up to 300 users
                { duration: '1m', target: 500 },   // Ramp up to 500 users
                { duration: '2m', target: 500 },   // Hold at 500 users
                { duration: '30s', target: 0 },    // Ramp down
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<2000', 'p(99)<5500'], // Baseline expectations
        'http_req_failed': ['rate<0.20'],                  // Less than 20% failures
        'registration_duration': ['p(95)<2000'],           // Registration response time
    },
};

// ===================================
// Custom Metrics
// ===================================

const registrationAttempts = new Counter('registration_attempts');
const registrationSuccess = new Counter('registration_success');
const registrationCapacityFull = new Counter('registration_capacity_full');
const registrationAlreadyRegistered = new Counter('registration_already_registered');
const registrationScheduleConflict = new Counter('registration_schedule_conflict');
const registrationOptimisticLock = new Counter('registration_optimistic_lock');
const registrationConnectionError = new Counter('registration_connection_error');
const registrationOtherError = new Counter('registration_other_error');
const registrationDuration = new Trend('registration_duration');
const eventsBrowseDuration = new Trend('events_browse_duration');
const myRegistrationsDuration = new Trend('my_registrations_duration');

// ===================================
// Helper Functions
// ===================================

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomSleep(min, max) {
    const duration = min + Math.random() * (max - min);
    sleep(duration);
}

// ===================================
// Main Test Function (User Journey)
// ===================================

export default function () {
    // Get unique student for this VU
    const studentIndex = (__VU - 1) % students.length;
    const student = students[studentIndex];

    const headers = {
        'Authorization': `Bearer ${student.token}`,
    };

    // ===================================
    // Step 1: Browse Events
    // ===================================

    const browseStart = Date.now();
    const eventsResponse = http.get(`${API_BASE_URL}/events`, {
        headers: headers,
        timeout: '10s',
    });
    const browseDuration = Date.now() - browseStart;
    eventsBrowseDuration.add(browseDuration);

    check(eventsResponse, {
        'events list retrieved': (r) => r.status === 200,
    });

    // Think time: User reviews events
    randomSleep(0.5, 2);

    // ===================================
    // Step 2: Register for Random Event
    // ===================================

    const eventID = randomElement(TARGET_EVENT_IDS);
    registrationAttempts.add(1);

    const registerStart = Date.now();
    const registerResponse = http.post(
        `${API_BASE_URL}/registrations/event/${eventID}`,
        null,
        {
            headers: headers,
            timeout: '10s',
        }
    );
    const registerDuration = Date.now() - registerStart;
    registrationDuration.add(registerDuration);

    // ===================================
    // Analyze Registration Response
    // ===================================

    const success = check(registerResponse, {
        'registration status is 201': (r) => r.status === 201 || r.status === 200,
    });

    if (success) {
        registrationSuccess.add(1);
    } else {
        // Categorize failure reason
        try {
            const body = registerResponse.json();
            const message = body.message || body.error || '';
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('capacity') ||
                lowerMessage.includes('full') ||
                lowerMessage.includes('no available spots')) {
                registrationCapacityFull.add(1);
            } else if (lowerMessage.includes('already registered') ||
                       lowerMessage.includes('duplicate')) {
                registrationAlreadyRegistered.add(1);
            } else if (lowerMessage.includes('schedule conflict') ||
                       lowerMessage.includes('time slot')) {
                registrationScheduleConflict.add(1);
            } else if (lowerMessage.includes('optimistic') ||
                       lowerMessage.includes('version') ||
                       lowerMessage.includes('conflict') ||
                       lowerMessage.includes('high traffic')) {
                registrationOptimisticLock.add(1);
            } else if (registerResponse.status === 0 ||
                       registerResponse.status >= 500 ||
                       lowerMessage.includes('connection') ||
                       lowerMessage.includes('timeout')) {
                registrationConnectionError.add(1);
            } else {
                registrationOtherError.add(1);
            }
        } catch (e) {
            registrationOtherError.add(1);
        }
    }

    // ===================================
    // Step 3: View My Registrations (if successful)
    // ===================================

    if (success) {
        // Think time before checking confirmation
        randomSleep(0.3, 1);

        const myRegsStart = Date.now();
        const myRegsResponse = http.get(`${API_BASE_URL}/registrations/me`, {
            headers: headers,
            timeout: '10s',
        });
        const myRegsDuration = Date.now() - myRegsStart;
        myRegistrationsDuration.add(myRegsDuration);

        check(myRegsResponse, {
            'my registrations retrieved': (r) => r.status === 200,
        });
    }

    // Think time: User considers next action
    randomSleep(1, 3);
}

// ===================================
// Setup: Display Test Information
// ===================================

export function setup() {
    console.log('\n========================================');
    console.log('DISTRIBUTED LOAD TEST - SETUP');
    console.log('========================================');
    console.log(`Total Students: ${students.length}`);
    console.log(`Target Events: ${TARGET_EVENT_IDS.length} events`);
    console.log(`Event IDs: ${TARGET_EVENT_IDS[0]} to ${TARGET_EVENT_IDS[TARGET_EVENT_IDS.length - 1]}`);
    console.log('========================================\n');
}

// ===================================
// Teardown: Summary Statistics
// ===================================

export function teardown(data) {
    console.log('\n========================================');
    console.log('DISTRIBUTED LOAD TEST - SUMMARY');
    console.log('========================================');

    // Query first few events to check registration counts
    console.log('\nSample Event Registrations:');

    for (let i = 0; i < Math.min(10, TARGET_EVENT_IDS.length); i++) {
        const eventID = TARGET_EVENT_IDS[i];
        const response = http.get(`${API_BASE_URL}/events/${eventID}`);

        if (response.status === 200) {
            try {
                const event = response.json().data;
                console.log(`  Event ${eventID}: ${event.currentRegistrations}/${event.capacity} registrations`);

                if (event.currentRegistrations > event.capacity) {
                    console.log(`    ❌ CAPACITY EXCEEDED!`);
                }
            } catch (e) {
                console.log(`  Event ${eventID}: Could not parse response`);
            }
        }
    }

    console.log('\n========================================\n');
}
