INSERT INTO users (
      user_type, email, password_hash,
      first_name, last_name,
      role, account_status, created_at,
      organization_name, department_affiliation,
      admin_level, admin_department
  ) VALUES

  -- 1. Event Organizer (Youth Union club)
  ('ORGANIZER', 'organizer.yu@ems.test',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Nguyen', 'Van A',
   'ORGANIZER', 'ACTIVE', NOW(),
   'IU Youth Union Club', 'Student Affairs',
   NULL, NULL),

  -- 2. Super Admin (account management + audit logs only)
  ('ADMIN', 'superadmin@ems.test',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Super', 'Admin',
   'ADMIN', 'ACTIVE', NOW(),
   NULL, NULL,
   'SUPER_ADMIN', NULL),

  -- 3. Standard Admin — Youth Union (L1 reviewer for YU proposals/updates)
  ('ADMIN', 'admin.yu@ems.test',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Tran', 'Thi B',
   'ADMIN', 'ACTIVE', NOW(),
   NULL, NULL,
   'STANDARD_ADMIN', 'YOUTH_UNION'),

  -- 4. Standard Admin — Student Association (L1 reviewer for SA proposals/updates)
  ('ADMIN', 'admin.sa@ems.test',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Le', 'Van C',
   'ADMIN', 'ACTIVE', NOW(),
   NULL, NULL,
   'STANDARD_ADMIN', 'STUDENT_ASSOCIATION'),

  -- 5. Standard Admin — Faculty (L2 reviewer for all proposals/updates)
  ('ADMIN', 'admin.faculty@ems.test',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Pham', 'Thi D',
   'ADMIN', 'ACTIVE', NOW(),
   NULL, NULL,
   'STANDARD_ADMIN', 'FACULTY'),

  -- 6. Rector - final 
  ('ADMIN', 'admin.rector@ems.test',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Vo', 'Van E',
   'ADMIN', 'ACTIVE', NOW(),
   NULL, NULL,
   'STANDARD_ADMIN', 'RECTOR');