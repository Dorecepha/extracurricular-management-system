-- =====================================================
-- Test Data: 2 Completed Events for Post-Event Report Testing
-- Both events: event_date = 2026-03-03
-- Organizer: organizer.yu@ems.test (user_id = 1)
-- Event IDs: 2 and 3
-- =====================================================

-- Event 2: Youth Union Event (COMPLETED)
INSERT INTO events (
    event_id, title, description, event_date, start_time, end_time,
    venue, capacity, current_registrations, status, approval_status,
    organization_type, organizer_id, created_at, updated_at, version
) VALUES (
    4,
    'Youth Union Leadership Training 2026',
    'Leadership training program for youth union members',
    '2026-03-03',
    '08:00:00',
    '17:00:00',
    'Conference Hall A',
    100,
    85,
    'COMPLETED',
    'APPROVED',
    'YOUTH_UNION',
    1,
    NOW(),
    NOW(),
    0
);

-- Post-event report for Youth Union (deadline = event end + 14 days)
INSERT INTO post_event_reports (
    event_id, event_type, affiliated_org, status, deadline_at,
    is_late, cert_export_locked, created_at, updated_at
) VALUES (
    4,
    'YOUTH_UNION',
    'IU Youth Union Club',
    'NOT_SUBMITTED',
    '2026-03-17 17:00:00',
    FALSE,
    FALSE,
    NOW(),
    NOW()
);