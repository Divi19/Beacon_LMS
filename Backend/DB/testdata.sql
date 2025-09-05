-- Sprint 1 seed (idempotent). Re-runnable and transactional.
-- Order: users -> profiles -> courses -> drafts -> enrollments

-- Switch default schema
SET search_path TO lms_schema;


-- ============ USERS (PostgreSQL upsert) ============
WITH src(email, password_hash, role) AS (
  VALUES
    ('alice@student.edu','hash_alice123','student'),
    ('bob@student.edu',  'hash_bob123',  'student'),
    ('carol@student.edu','hash_carol123','student'),
    ('jane@instructor.edu','hash_jane456','instructor'),
    ('mark@instructor.edu','hash_mark789','instructor')
)
INSERT INTO users AS u (email, password_hash, role)
SELECT s.email, s.password_hash, s.role
FROM src s
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role           = EXCLUDED.role;


    -- ============ STUDENT PROFILE ============
-- Uses student_no as the natural key (UNIQUE in your schema)
WITH raw(full_name, student_no, email) AS (
  VALUES
    ('Alice Tan', 'S1001', 'alice@student.edu'),
    ('Bob Gomez', 'S1002', 'bob@student.edu'),
    ('Carol Ong', 'S1003', 'carol@student.edu')
),
src AS (
  SELECT r.full_name, r.student_no, u.user_id
  FROM raw r
  JOIN users u ON u.email = r.email
)
INSERT INTO student_profile AS sp (user_id, full_name, student_no, locked_at)
SELECT s.user_id, s.full_name, s.student_no, NULL
FROM src s
ON CONFLICT (student_no) DO UPDATE
SET full_name = EXCLUDED.full_name,
    user_id   = EXCLUDED.user_id;

