-- =====================================================
-- Test Data: 2 Completed Events for Post-Event Report Testing
-- Both events: event_date = 2026-03-03
-- Organizer: organizer.yu@ems.test (user_id = 1)
-- Event IDs: 2 and 3
-- =====================================================

-- Event 5: Student Association Event (COMPLETED)
INSERT INTO events (
    event_id, title, description, event_date, start_time, end_time,
    venue, capacity, current_registrations, status, approval_status,
    organization_type, organizer_id, created_at, updated_at, version
) VALUES (
    5,
    'Tech Innovation Workshop 2026',
    'Hands-on workshop for students to learn about latest tech trends',
    '2026-03-03',
    '13:00:00',
    '18:00:00',
    'IU Tech Center Room 301',
    50,
    48,
    'COMPLETED',
    'APPROVED',
    'STUDENT_ASSOCIATION',
    1,
    NOW(),
    NOW(),
    0
);

-- Post-event report for Student Association Event 5 (deadline = event end + 7 days)
INSERT INTO post_event_reports (
    event_id, event_type, affiliated_org, status, deadline_at,
    is_late, cert_export_locked, created_at, updated_at
) VALUES (
    5,
    'STUDENT_ASSOCIATION',
    'IU Student Association',
    'NOT_SUBMITTED',
    '2026-03-10 18:00:00',
    FALSE,
    FALSE,
    NOW(),
    NOW()
);
