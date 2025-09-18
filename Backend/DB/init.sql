-- Switch default schema
SET search_path = lms_schema;

-- Drop existing tables in correct dependency order
DROP TABLE IF EXISTS enrollment CASCADE;
DROP TABLE IF EXISTS course_draft CASCADE;
DROP TABLE IF EXISTS course CASCADE;
DROP TABLE IF EXISTS instructor_profile CASCADE;
DROP TABLE IF EXISTS student_profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
    user_id INT REFERENCES users(user_id),
    full_name VARCHAR(255) NOT NULL,
    student_no VARCHAR(50) UNIQUE NOT NULL,
    locked_at TIMESTAMP
);

-- INSTRUCTOR PROFILE
CREATE TABLE instructor_profile (
    instructor_profile_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    full_name VARCHAR(255) NOT NULL,
    staff_no VARCHAR(50) UNIQUE NOT NULL
);

-- COURSE
CREATE TABLE course (
    course_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    owner_instructor_id INT REFERENCES instructor_profile(instructor_profile_id)
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
    student_id INT REFERENCES student_profile(student_profile_id),
    course_id INT REFERENCES course(course_id),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

ALTER TABLE course ADD COLUMN credits INTEGER;
ALTER TABLE course ADD COLUMN director VARCHAR(50);
ALTER TABLE course ADD COLUMN description TEXT;

-- === Sprint 2 US1: Enforce instructor ownership on courses + index
ALTER TABLE course
  ALTER COLUMN owner_instructor_id SET NOT NULL;

ALTER TABLE course DROP CONSTRAINT IF EXISTS course_owner_instructor_id_fkey;
ALTER TABLE course
  ADD CONSTRAINT fk_course_owner_instructor
  FOREIGN KEY (owner_instructor_id) REFERENCES instructor_profile(instructor_profile_id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_course_owner ON course(owner_instructor_id);


-- === US2 Job 1: LESSON + PREREQUISITE core structures

-- LESSON: instructors can pre-structure lessons under a course
CREATE TABLE IF NOT EXISTS lesson (
  lesson_id       SERIAL PRIMARY KEY,
  course_id       INT NOT NULL REFERENCES course(course_id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  objectives      TEXT,
  duration_weeks  INT,                     
  status          VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      INT NOT NULL REFERENCES instructor_profile(instructor_profile_id),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Self-referencing many-to-many prerequisites
CREATE TABLE IF NOT EXISTS lesson_prerequisite (
  lesson_id        INT NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  prereq_lesson_id INT NOT NULL REFERENCES lesson(lesson_id),
  CONSTRAINT pk_lesson_prerequisite PRIMARY KEY (lesson_id, prereq_lesson_id),
  CONSTRAINT chk_no_self_prereq CHECK (lesson_id <> prereq_lesson_id)
);

-- Tighten COURSE_DRAFT author requirement 
ALTER TABLE course_draft
  ALTER COLUMN created_by SET NOT NULL;

--  JSON -> JSONB for better querying (safe cast)
ALTER TABLE course_draft
  ALTER COLUMN outline_json TYPE JSONB USING outline_json::jsonb;

-- === US2 Job 2: Indexes to speed up common lesson workflows
CREATE INDEX IF NOT EXISTS idx_lesson_course     ON lesson(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_status     ON lesson(status);
CREATE INDEX IF NOT EXISTS idx_lesson_created_by ON lesson(created_by);

-- === US3 Job 1: Classrooms offered for a lesson
CREATE TABLE IF NOT EXISTS classroom (
  classroom_id    SERIAL PRIMARY KEY,
  lesson_id       INT NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  instructor_id   INT NOT NULL REFERENCES instructor_profile(instructor_profile_id),
  title           VARCHAR(255) NOT NULL,
  duration_weeks  INT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  capacity        INT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- === US3 Job 2: Indexes for fast classroom access
CREATE INDEX IF NOT EXISTS idx_classroom_lesson     ON classroom(lesson_id);
CREATE INDEX IF NOT EXISTS idx_classroom_instructor ON classroom(instructor_id);
