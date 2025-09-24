-- =========================================================
-- Switch default schema
-- =========================================================
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

-- COURSE (
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

-- LESSON 
CREATE TABLE lesson (
  lesson_id       SERIAL PRIMARY KEY,
  course_id       INT NOT NULL REFERENCES course(course_id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  objectives      TEXT,
  duration_weeks  INT,
  status          VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      INT NOT NULL REFERENCES instructor_profile(instructor_profile_id),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  prerequisite    TEXT
);

-- LESSON_PREREQUISITE 
CREATE TABLE lesson_prerequisite (
  lesson_id        INT NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  prereq_lesson_id INT NOT NULL REFERENCES lesson(lesson_id),
  CONSTRAINT pk_lesson_prerequisite PRIMARY KEY (lesson_id, prereq_lesson_id),
  CONSTRAINT chk_no_self_prereq CHECK (lesson_id <> prereq_lesson_id)
);

-- CLASSROOM 
CREATE TABLE classroom (
  classroom_id    SERIAL PRIMARY KEY,
  lesson_id       INT NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  instructor_id   INT NOT NULL REFERENCES instructor_profile(instructor_profile_id),
  title           VARCHAR(255) NOT NULL,
  -- duration_weeks  INT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  capacity        INT,
  -- NEW scheduling fields for day
  day_of_week     VARCHAR(20) NOT NULL CHECK (
    day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
  ),
  time_start      TIME NOT NULL,
  time_end        TIME NOT NULL,
  CONSTRAINT chk_class_time_order CHECK (time_start < time_end),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LESSON_ENROLLMENT 
CREATE TABLE lesson_enrollment (
  lesson_id    INT NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  student_id   INT NOT NULL REFERENCES student_profile(student_profile_id),
  enrolled_at  TIMESTAMP NOT NULL DEFAULT NOW(),
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
ALTER TABLE course ADD COLUMN number_of_lessons INT DEFAULT 0;

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

-- avoid duplicate exact sessions for same lesson/day/time
ALTER TABLE classroom
  ADD CONSTRAINT uq_lesson_day_time UNIQUE (lesson_id, day_of_week, time_start, time_end);

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

-- course ownership lookup
CREATE INDEX IF NOT EXISTS idx_course_owner ON course(owner_instructor_id);

--  lesson lookups
CREATE INDEX IF NOT EXISTS idx_lesson_course     ON lesson(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_status     ON lesson(status);
CREATE INDEX IF NOT EXISTS idx_lesson_created_by ON lesson(created_by);

-- classroom lookups
CREATE INDEX IF NOT EXISTS idx_classroom_lesson     ON classroom(lesson_id);
CREATE INDEX IF NOT EXISTS idx_classroom_instructor ON classroom(instructor_id);
-- classroom timetable lookups
CREATE INDEX IF NOT EXISTS idx_classroom_day       ON classroom(day_of_week);
CREATE INDEX IF NOT EXISTS idx_classroom_day_time  ON classroom(day_of_week, time_start);

-- lesson enrollment lookups
CREATE INDEX IF NOT EXISTS idx_lesson_enr_student ON lesson_enrollment(student_id);

-- classroom enrollment lookups
CREATE INDEX IF NOT EXISTS idx_classroom_enr_student ON classroom_enrollment(student_id);

-- Sprint 1 course-level enrollment
CREATE INDEX IF NOT EXISTS idx_enrollment_course  ON enrollment(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollment(student_id);

-- =========================================================
-- Notes:
-- -> Business rule (Sprint 2 US5): a student should be enrolled in the lesson
--   before enrolling in any classroom of that lesson. Enforce later
--   via trigger or application logic.
-- =========================================================
