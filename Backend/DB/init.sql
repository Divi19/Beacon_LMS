-- =========================================================
-- Switch default schema
SET search_path = public;

-- =========================================================
-- 1) DROP tables
-- =========================================================
DROP TABLE IF EXISTS classroom_enrollment CASCADE;
DROP TABLE IF EXISTS lesson_enrollment CASCADE;
DROP TABLE IF EXISTS classroom CASCADE;
DROP TABLE IF EXISTS lesson_prerequisite CASCADE;
DROP TABLE IF EXISTS lesson CASCADE;
DROP TABLE IF EXISTS enrollment CASCADE;
DROP TABLE IF EXISTS course_draft CASCADE;
DROP TABLE IF EXISTS course CASCADE;
DROP TABLE IF EXISTS instructor_profile CASCADE;
DROP TABLE IF EXISTS student_profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================================
-- 2) CREATE TABLES 
-- =========================================================

-- USERS 
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- STUDENT PROFILE 
CREATE TABLE student_profile (
    student_profile_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    -- name parts added (keep full_name for backward compatibility if you still need it)
    first_name VARCHAR(120),
    last_name  VARCHAR(120),
    titled     VARCHAR(40),
    full_name  VARCHAR(255),
    student_no VARCHAR(50) UNIQUE NOT NULL,
    locked_at TIMESTAMP
);

-- INSTRUCTOR PROFILE 
CREATE TABLE instructor_profile (
    instructor_profile_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    staff_no VARCHAR(50) UNIQUE NOT NULL
);


-- COURSE 
CREATE TABLE course (
    course_id VARCHAR(32) PRIMARY KEY,         -- readable (e.g. AB1234)
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    owner_instructor_id INT NOT NULL REFERENCES instructor_profile(instructor_profile_id) ON DELETE RESTRICT
);


-- COURSE DRAFT 
CREATE TABLE course_draft (
    draft_id SERIAL PRIMARY KEY,
    course_id INT REFERENCES course(course_id),
    title VARCHAR(255) NOT NULL,
    outline_json JSON,
    created_by INT REFERENCES instructor_profile(instructor_profile_id),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ENROLLMENT 
CREATE TABLE enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE RESTRICT,
    course_id  VARCHAR(32) NOT NULL REFERENCES course(course_id) ON DELETE RESTRICT,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);


-- LESSON 
CREATE TABLE lesson (
  lesson_id      VARCHAR(32) PRIMARY KEY,
  course_id      VARCHAR(32) NOT NULL REFERENCES course(course_id) ON DELETE RESTRICT,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  objectives     TEXT,
  duration_weeks INT,
  credits        INT NOT NULL DEFAULT 0,
  status         VARCHAR(50) NOT NULL DEFAULT 'draft',
  designer_id    INT NOT NULL REFERENCES instructor_profile(instructor_profile_id) ON DELETE RESTRICT,
  created_by     INT NOT NULL REFERENCES instructor_profile(instructor_profile_id) ON DELETE RESTRICT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);


-- LESSON_PREREQUISITE 
CREATE TABLE lesson_prerequisite (
  lesson_id        VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  prereq_lesson_id VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE RESTRICT,
  CONSTRAINT chk_no_self_prereq CHECK (lesson_id <> prereq_lesson_id),
  CONSTRAINT uq_lesson_prereq UNIQUE (lesson_id, prereq_lesson_id)
);


-- CLASSROOM 
CREATE TABLE classroom (
  director       VARCHAR(255),
  classroom_id   VARCHAR(32) PRIMARY KEY,
  location       VARCHAR(255),
  duration_weeks INT,
  capacity       INT,
  is_online      BOOLEAN NOT NULL DEFAULT FALSE,
  zoom_link      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LESSON_CLASSROOM (lesson offered in classroom with optional schedule)
CREATE TABLE lesson_classroom (
  lesson_id          VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  classroom_id       VARCHAR(32) NOT NULL REFERENCES classroom(classroom_id) ON DELETE RESTRICT,
  session_times_json JSONB,
  linked_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lesson_id, classroom_id)
);

-- LESSON_ENROLLMENT 
CREATE TABLE lesson_enrollment (
  lesson_id   VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  student_id  INT         NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_lesson_enrollment PRIMARY KEY (lesson_id, student_id)
);

-- CLASSROOM_ENROLLMENT 
CREATE TABLE classroom_enrollment (
  classroom_id  INT NOT NULL REFERENCES classroom(classroom_id) ON DELETE CASCADE,
  student_id    INT NOT NULL REFERENCES student_profile(student_profile_id),
  enrolled_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_classroom_enrollment PRIMARY KEY (classroom_id, student_id)
);

-- =========================================================
-- 3) ALTER TABLES (add columns / constraints / type tweaks)
-- =========================================================

-- Course added fields
ALTER TABLE course ADD COLUMN credits INT;
ALTER TABLE course ADD COLUMN director VARCHAR(50);
ALTER TABLE course ADD COLUMN description TEXT;

-- Enforce course ownership and restrict delete
ALTER TABLE course
  ALTER COLUMN owner_instructor_id SET NOT NULL;

ALTER TABLE course DROP CONSTRAINT IF EXISTS course_owner_instructor_id_fkey;
ALTER TABLE course
  ADD CONSTRAINT fk_course_owner_instructor
  FOREIGN KEY (owner_instructor_id) REFERENCES instructor_profile(instructor_profile_id)
  ON DELETE RESTRICT;

-- Tighten course_draft author + upgrade outline_json to JSONB
ALTER TABLE course_draft
  ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE course_draft
  ALTER COLUMN outline_json TYPE JSONB USING outline_json::jsonb;

---Adding surrogate keys
-- LESSON_PREREQUISITE: drop composite PK, add id, add UNIQUE
ALTER TABLE lesson_prerequisite DROP CONSTRAINT pk_lesson_prerequisite;
ALTER TABLE lesson_prerequisite ADD COLUMN id SERIAL;
ALTER TABLE lesson_prerequisite ADD CONSTRAINT lesson_prerequisite_pkey PRIMARY KEY (id);
ALTER TABLE lesson_prerequisite ADD CONSTRAINT uq_lesson_prereq UNIQUE (lesson_id, prereq_lesson_id);

-- LESSON_ENROLLMENT: drop composite PK, add id, add UNIQUE
ALTER TABLE lesson_enrollment DROP CONSTRAINT pk_lesson_enrollment;
ALTER TABLE lesson_enrollment ADD COLUMN id SERIAL;
ALTER TABLE lesson_enrollment ADD CONSTRAINT lesson_enrollment_pkey PRIMARY KEY (id);
ALTER TABLE lesson_enrollment ADD CONSTRAINT uq_lesson_enrollment UNIQUE (lesson_id, student_id);

-- CLASSROOM_ENROLLMENT: drop composite PK, add id, add UNIQUE
ALTER TABLE classroom_enrollment DROP CONSTRAINT pk_classroom_enrollment;
ALTER TABLE classroom_enrollment ADD COLUMN id SERIAL;
ALTER TABLE classroom_enrollment ADD CONSTRAINT classroom_enrollment_pkey PRIMARY KEY (id);
ALTER TABLE classroom_enrollment ADD CONSTRAINT uq_classroom_enrollment UNIQUE (classroom_id, student_id);




-- =========================================================
-- 4) INDEXES (performance/lookup)
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_lesson_designer ON lesson(designer_id);

---Index on studnet and instructor profile
CREATE INDEX IF NOT EXISTS idx_student_user_id    ON student_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_user_id ON instructor_profile(user_id);

-- course ownership lookup
CREATE INDEX IF NOT EXISTS idx_course_owner ON course(owner_instructor_id);

--  lesson lookups
CREATE INDEX IF NOT EXISTS idx_lesson_course     ON lesson(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_status     ON lesson(status);
CREATE INDEX IF NOT EXISTS idx_lesson_created_by ON lesson(created_by);

-- lesson enrollment lookups
CREATE INDEX IF NOT EXISTS idx_lesson_enr_student ON lesson_enrollment(student_id);

-- classroom enrollment lookups
CREATE INDEX IF NOT EXISTS idx_classroom_enr_student ON classroom_enrollment(student_id);

-- Sprint 1 course-level enrollment
CREATE INDEX IF NOT EXISTS idx_enrollment_course  ON enrollment(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollment(student_id);

CREATE INDEX IF NOT EXISTS idx_classroom_active ON classroom(is_active);

CREATE INDEX IF NOT EXISTS idx_lc_lesson    ON lesson_classroom(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lc_classroom ON lesson_classroom(classroom_id);


-- =========================================================
-- Notes:
-- -> Business rule (Sprint 2 US5): a student should be enrolled in the lesson
--   before enrolling in any classroom of that lesson. Enforce later
--   via trigger or application logic.
-- =========================================================


