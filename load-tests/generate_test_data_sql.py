#!/usr/bin/env python3
"""
Generate SQL script for EMS load testing data
Outputs: load-test-data.sql (ready to execute)
"""
from datetime import datetime, timedelta

# Configuration
BCRYPT_HASH = "$2a$10$hKPX3WNUR5xv.XmOeS7vZOJyXq7SoobdRs/DmTyNhrufb.9e9F4PS"
NUM_STUDENTS = 10000
NUM_ORGANIZERS = 50
NUM_EVENTS = 100

# Major distribution (must sum to 100%)
MAJORS = [
    ("Computer Science", 0.40),      # 4000 students
    ("Business Administration", 0.30), # 3000 students
    ("Engineering", 0.20),            # 2000 students
    ("Liberal Arts", 0.10)            # 1000 students
]

# Event capacity distribution
EVENT_CAPACITIES = [
    (10, 20),    # 20 small workshops
    (50, 30),    # 30 seminars
    (100, 30),   # 30 lectures
    (500, 20)    # 20 conferences
]

def generate_organizers():
    """Generate 50 event organizer INSERT statements"""
    sql = []
    sql.append("\n-- ================================================")
    sql.append("-- PART 1: Event Organizers (50 accounts)")
    sql.append("-- ================================================\n")

    org_types = [
        ("Youth Union", ["Student Affairs", "Community Service", "Cultural Activities", "Leadership Development", "Volunteer Programs"]),
        ("Student Association", ["Computer Science Club", "Business Club", "Engineering Society", "Arts Council", "Sports Association"])
    ]

    sql.append("INSERT INTO users (user_type, email, password_hash, first_name, last_name, role, account_status, organization_name, department_affiliation, created_at)")
    sql.append("VALUES")

    values = []
    for i in range(1, NUM_ORGANIZERS + 1):
        org_idx = 0 if i <= 25 else 1
        org_name = org_types[org_idx][0]
        dept = org_types[org_idx][1][(i - 1) % len(org_types[org_idx][1])]

        values.append(
            f"('ORGANIZER', 'organizer{i}@university.edu', '{BCRYPT_HASH}', "
            f"'Organizer', '{i}', 'ORGANIZER', 'ACTIVE', '{org_name}', '{dept}', NOW())"
        )

    sql.append(",\n".join(values) + ";")
    return "\n".join(sql)

def generate_students():
    """Generate 10,000 student INSERT statements in batches"""
    sql = []
    sql.append("\n-- ================================================")
    sql.append("-- PART 2: Test Students (10,000 accounts)")
    sql.append("-- ================================================\n")

    # Calculate students per major
    major_counts = [(major, int(NUM_STUDENTS * pct)) for major, pct in MAJORS]

    batch_size = 500  # Insert 500 students at a time for readability
    student_num = 1

    for major, count in major_counts:
        sql.append(f"\n-- {major} Students ({count} total)")
        remaining = count

        while remaining > 0:
            current_batch = min(batch_size, remaining)
            sql.append(f"\nINSERT INTO users (user_type, email, password_hash, first_name, last_name, role, account_status, student_id, major, year_of_study, created_at)")
            sql.append("VALUES")

            values = []
            for _ in range(current_batch):
                student_id = f"S2026{student_num:05d}"
                year = ((student_num - 1) % 4) + 1  # Distribute evenly across years 1-4

                values.append(
                    f"('STUDENT', 'student{student_num}@university.edu', '{BCRYPT_HASH}', "
                    f"'Student', '{student_num}', 'STUDENT', 'ACTIVE', '{student_id}', '{major}', {year}, NOW())"
                )
                student_num += 1

            sql.append(",\n".join(values) + ";")
            remaining -= current_batch

    return "\n".join(sql)

def generate_events():
    """Generate 100 event INSERT statements"""
    sql = []
    sql.append("\n-- ================================================")
    sql.append("-- PART 3: Test Events (100 events)")
    sql.append("-- ================================================\n")

    sql.append("INSERT INTO events (title, description, event_date, start_time, end_time, venue, capacity, current_registrations, status, approval_status, organization_type, organizer_id, created_at, version)")
    sql.append("VALUES")

    event_num = 1
    values = []
    start_date = datetime.now() + timedelta(days=5)  # Start 5 days from now

    event_types = [
        ("Workshop", "Room A"),
        ("Seminar", "Hall B"),
        ("Lecture", "Auditorium C"),
        ("Conference", "Main Hall")
    ]

    time_slots = [
        ("09:00:00", "11:00:00"),  # Morning
        ("14:00:00", "16:00:00"),  # Afternoon
        ("18:00:00", "20:00:00")   # Evening
    ]

    org_types = ["YOUTH_UNION", "STUDENT_ASSOCIATION"]

    for type_idx, (capacity, count) in enumerate(EVENT_CAPACITIES):
        event_type, venue_base = event_types[type_idx]

        for i in range(count):
            # Spread events across 90 days
            days_offset = (event_num * 90) // NUM_EVENTS
            event_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")

            # Rotate through time slots
            start_time, end_time = time_slots[event_num % len(time_slots)]

            # Assign to organizers (round-robin)
            organizer_id = ((event_num - 1) % NUM_ORGANIZERS) + 1

            # Alternate organization types
            org_type = org_types[event_num % 2]

            venue = f"{venue_base}{(i % 10) + 1}"

            values.append(
                f"('{event_type} {event_num}: Load Test Event', "
                f"'Automated test event for load testing', "
                f"'{event_date}', '{start_time}', '{end_time}', '{venue}', "
                f"{capacity}, 0, 'UPCOMING', 'APPROVED', '{org_type}', "
                f"{organizer_id}, NOW(), 0)"
            )
            event_num += 1

    sql.append(",\n".join(values) + ";")
    return "\n".join(sql)

def generate_full_script():
    """Generate complete SQL script"""
    script = []

    script.append("-- " + "=" * 60)
    script.append("-- EMS Load Testing Data Generation Script")
    script.append("-- " + "=" * 60)
    script.append("-- Generated: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    script.append("-- Students: " + str(NUM_STUDENTS))
    script.append("-- Organizers: " + str(NUM_ORGANIZERS))
    script.append("-- Events: " + str(NUM_EVENTS))
    script.append("-- " + "=" * 60)
    script.append("\n-- Disable foreign key checks for faster inserts")
    script.append("SET FOREIGN_KEY_CHECKS = 0;")
    script.append("SET autocommit = 0;")

    script.append(generate_organizers())
    script.append(generate_students())
    script.append(generate_events())

    script.append("\n-- Commit all changes")
    script.append("COMMIT;")
    script.append("SET FOREIGN_KEY_CHECKS = 1;")

    # Add verification queries
    script.append("\n-- " + "=" * 60)
    script.append("-- VERIFICATION QUERIES")
    script.append("-- " + "=" * 60)
    script.append("""
SELECT 'User Counts' as Check_Type, user_type, COUNT(*) as count
FROM users
GROUP BY user_type;

SELECT 'Major Distribution' as Check_Type, major, COUNT(*) as count
FROM users
WHERE user_type = 'STUDENT'
GROUP BY major;

SELECT 'Event Capacity Distribution' as Check_Type, capacity, COUNT(*) as count
FROM events
GROUP BY capacity
ORDER BY capacity;

SELECT 'Total Capacity' as Check_Type, COUNT(*) as events, SUM(capacity) as total_capacity
FROM events;
""")

    return "\n".join(script)

if __name__ == "__main__":
    output_file = "load-test-data.sql"
    print(f"Generating SQL script: {output_file}...")

    sql_content = generate_full_script()

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql_content)

    print(f"[OK] Generated {len(sql_content.splitlines())} lines of SQL")
    print(f"[OK] File size: {len(sql_content) / 1024:.1f} KB")
    print(f"\nTo execute:")
    print(f"  mysql -u app_user -p ems_db < {output_file}")
    print(f"  (Password: dorecefa)")
