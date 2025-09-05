-- Sprint 1 seed (idempotent). Re-runnable and transactional.
-- Order: users -> profiles -> courses -> drafts -> enrollments

BEGIN;

SET search_path = lms_schema;

-- ============ USERS ============
MERGE INTO users u
USING (
  SELECT 'alice@student.edu' AS email,  'hash_alice123' AS password_hash, 'student' AS role FROM dual UNION ALL
  SELECT 'bob@student.edu',    'hash_bob123',   'student' FROM dual UNION ALL
  SELECT 'carol@student.edu',  'hash_carol123', 'student' FROM dual UNION ALL
  SELECT 'jane@instructor.edu','hash_jane456',  'instructor' FROM dual UNION ALL
  SELECT 'mark@instructor.edu','hash_mark789',  'instructor' FROM dual
) src
ON (u.email = src.email)
WHEN MATCHED THEN
  UPDATE SET u.role = src.role
WHEN NOT MATCHED THEN
  INSERT (email, password_hash, role)
  VALUES (src.email, src.password_hash, src.role);

COMMIT;