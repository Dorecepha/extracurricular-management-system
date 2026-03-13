-- =====================================================
-- Test Data: 2 Completed Events for Post-Event Report Testing
-- =====================================================

-- Event 2: Youth Union (deadline = event date + 14 days)
INSERT INTO events (
    event_id, title, description, event_date, start_time, end_time,
    venue, capacity, current_registrations, status, approval_status,
    organization_type, organizer_id, created_at, updated_at, version
) VALUES (
    2,
    'Spring Youth Union Festival 2026',
    'Annual spring festival organized by IU Youth Union Club.',
    '2026-03-03',
    '08:00:00',
    '17:00:00',
    'IU Main Hall',
    200,
    180,
    'COMPLETED',
    'APPROVED',
    'YOUTH_UNION',
    1,
    NOW(),
    NOW(),
    0
);

-- Event 3: Student Association (deadline = event date + 7 days)
INSERT INTO events (
    event_id, title, description, event_date, start_time, end_time,
    venue, capacity, current_registrations, status, approval_status,
    organization_type, organizer_id, created_at, updated_at, version
) VALUES (
    3,
    'Tech Innovation Workshop 2026',
    'Hands-on workshop for students to learn about latest tech trends.',
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

-- Post-Event Reports (will be created automatically, but creating manually for testing)
INSERT INTO post_event_reports (
    event_id, event_type, affiliated_org, status, deadline_at,
    is_late, cert_export_locked, created_at, updated_at
) VALUES (
    2, 'YOUTH_UNION', 'IU Youth Union Club', 'NOT_SUBMITTED',
    '2026-03-17 17:00:00',  -- Event date + 14 days
    FALSE, FALSE, NOW(), NOW()
);

INSERT INTO post_event_reports (
    event_id, event_type, affiliated_org, status, deadline_at,
    is_late, cert_export_locked, created_at, updated_at
) VALUES (
    3, 'STUDENT_ASSOCIATION', 'IU Student Association', 'NOT_SUBMITTED',
    '2026-03-10 18:00:00',  -- Event date + 7 days
    FALSE, FALSE, NOW(), NOW()
);
