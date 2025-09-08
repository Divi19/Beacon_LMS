-- db/testdata.sql
-- Sprint 1 seed (idempotent). Re-runnable and transactional.
-- Order: users -> profiles -> courses -> drafts -> enrollments

BEGIN;

-- Work inside our app schema
SET search_path = lms_schema;

------------------------------------------------------------
-- USERS (PostgreSQL upsert)
------------------------------------------------------------
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

------------------------------------------------------------
-- STUDENT PROFILE
------------------------------------------------------------
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

------------------------------------------------------------
-- INSTRUCTOR PROFILE
------------------------------------------------------------
WITH raw(full_name, staff_no, email) AS (
  VALUES
    ('Jane Smith', 'T3001', 'jane@instructor.edu'),
    ('Mark Lee',   'T3002', 'mark@instructor.edu')
),
src AS (
  SELECT r.full_name, r.staff_no, u.user_id
  FROM raw r
  JOIN users u ON u.email = r.email
)
INSERT INTO instructor_profile AS ip (user_id, full_name, staff_no)
SELECT s.user_id, s.full_name, s.staff_no
FROM src s
ON CONFLICT (staff_no) DO UPDATE
SET full_name = EXCLUDED.full_name,
    user_id   = EXCLUDED.user_id;

------------------------------------------------------------
-- COURSES  (now with credits/director/description)
--  owner_instructor resolved by owner_email
------------------------------------------------------------
WITH src(code, title, status, owner_email, credits, director, description) AS (
  VALUES
    ('FIT101', 'Intro to Python', 'published', 'jane@instructor.edu', 6, 'Jane Smith',
     'Foundations of Python programming with problem solving and small projects.'),
    ('FIT102', 'Databases 1',     'draft',     'mark@instructor.edu', 6, 'Mark Lee',
     'Relational modeling, SQL (DDL/DML), constraints and basic transactions.')
),
owners AS (
  SELECT s.code, s.title, s.status, s.credits, s.director, s.description,
         ip.instructor_profile_id AS owner_instructor_id
  FROM src s
  JOIN users u              ON u.email = s.owner_email
  JOIN instructor_profile ip ON ip.user_id = u.user_id
)
INSERT INTO course AS c
  (code, title, status, owner_instructor_id, credits, director, description)
SELECT o.code, o.title, o.status, o.owner_instructor_id, o.credits, o.director, o.description
FROM owners o
ON CONFLICT (code) DO UPDATE
SET title               = EXCLUDED.title,
    status              = EXCLUDED.status,
    owner_instructor_id = EXCLUDED.owner_instructor_id,
    credits             = EXCLUDED.credits,
    director            = EXCLUDED.director,
    description         = EXCLUDED.description;

------------------------------------------------------------
-- COURSE DRAFTS (idempotent via NOT EXISTS)
------------------------------------------------------------
WITH src(title, outline_json, created_by_email, for_course_code, is_selected) AS (
  VALUES
    ('Intro to Python - v1',  '{"weeks":6}'::json,  'jane@instructor.edu', 'FIT101', false),
    ('Intro to Python - v2',  '{"weeks":8}'::json,  'jane@instructor.edu', 'FIT101', true),
    ('Databases 1 - draft A', '{"modules":5}'::json,'mark@instructor.edu', 'FIT102', true)
),
resolved AS (
  SELECT s.title, s.outline_json, s.is_selected,
         ip.instructor_profile_id AS created_by,
         c.course_id
  FROM src s
  JOIN users u               ON u.email = s.created_by_email
  JOIN instructor_profile ip ON ip.user_id = u.user_id
  LEFT JOIN course c         ON c.code = s.for_course_code
)
INSERT INTO course_draft (course_id, title, outline_json, created_by, is_selected)
SELECT r.course_id, r.title, r.outline_json, r.created_by, r.is_selected
FROM resolved r
WHERE NOT EXISTS (
  SELECT 1 FROM course_draft d
  WHERE d.title = r.title AND d.created_by = r.created_by
);

------------------------------------------------------------
-- ENROLLMENTS
------------------------------------------------------------
WITH src(student_email, course_code) AS (
  VALUES
    ('alice@student.edu','FIT101'),
    ('bob@student.edu',  'FIT101'),
    ('carol@student.edu','FIT102')
),
resolved AS (
  SELECT sp.student_profile_id AS student_id, c.course_id
  FROM src s
  JOIN users u            ON u.email = s.student_email
  JOIN student_profile sp ON sp.user_id = u.user_id
  JOIN course c           ON c.code   = s.course_code
)
INSERT INTO enrollment AS e (student_id, course_id)
SELECT r.student_id, r.course_id
FROM resolved r
ON CONFLICT (student_id, course_id) DO NOTHING;

COMMIT;
