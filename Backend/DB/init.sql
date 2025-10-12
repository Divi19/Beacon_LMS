-- =========================================================
-- Switch default schema
SET search_path = lms_schema;

-- =========================================================
-- 1) DROP tables (children first, then parents)
-- =========================================================
DROP TABLE IF EXISTS student_assignment      CASCADE;
DROP TABLE IF EXISTS lesson_assignment       CASCADE;
DROP TABLE IF EXISTS student_reading         CASCADE;
DROP TABLE IF EXISTS lesson_reading          CASCADE;
DROP TABLE IF EXISTS classroom_enrollment    CASCADE;
DROP TABLE IF EXISTS lesson_enrollment       CASCADE;
DROP TABLE IF EXISTS lesson_classroom        CASCADE;
DROP TABLE IF EXISTS classroom               CASCADE;
DROP TABLE IF EXISTS lesson_prerequisite     CASCADE;
DROP TABLE IF EXISTS lesson                  CASCADE;
DROP TABLE IF EXISTS enrollment              CASCADE;
DROP TABLE IF EXISTS course_draft            CASCADE;
DROP TABLE IF EXISTS course                  CASCADE;
DROP TABLE IF EXISTS instructor_profile      CASCADE;
DROP TABLE IF EXISTS student_profile         CASCADE;
DROP TABLE IF EXISTS "user"                  CASCADE;

-- =========================================================
-- 2) CREATE TABLES
-- =========================================================

-- USERS
CREATE TABLE "user" (
  user_id       SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

-- STUDENT PROFILE
CREATE TABLE student_profile (
  student_profile_id SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES "user"(user_id) ON DELETE RESTRICT,
  first_name         VARCHAR(120),
  last_name          VARCHAR(120),
  titled             VARCHAR(40),
  full_name          VARCHAR(255),
  student_no         VARCHAR(50) UNIQUE NOT NULL,
  locked_at          TIMESTAMP
);

-- INSTRUCTOR PROFILE
CREATE TABLE instructor_profile (
  instructor_profile_id SERIAL PRIMARY KEY,
  user_id               INT NOT NULL REFERENCES "user"(user_id) ON DELETE RESTRICT,
  full_name             VARCHAR(255) NOT NULL,
  staff_no              VARCHAR(50) UNIQUE NOT NULL
);

-- COURSE
CREATE TABLE course (
  course_id            VARCHAR(32) PRIMARY KEY,
  title                VARCHAR(255) NOT NULL,
  status               VARCHAR(50)  NOT NULL,
  owner_instructor_id  INT NOT NULL REFERENCES instructor_profile(instructor_profile_id) ON DELETE RESTRICT,
  credits              INT,
  description          TEXT
);

-- ENROLLMENT (course-level)
CREATE TABLE enrollment (
  enrollment_id SERIAL PRIMARY KEY,
  student_id    INT         NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE RESTRICT,
  course_id     VARCHAR(32) NOT NULL REFERENCES course(course_id) ON DELETE RESTRICT,
  enrolled_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
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

-- LESSON PREREQUISITE
CREATE TABLE lesson_prerequisite (
  lesson_prerequisite_id SERIAL PRIMARY KEY,
  lesson_id              VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  prereq_lesson_id       VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE RESTRICT,
  CONSTRAINT chk_no_self_prereq CHECK (lesson_id <> prereq_lesson_id),
  CONSTRAINT uq_lesson_prereq UNIQUE (lesson_id, prereq_lesson_id)
);

-- CLASSROOM (no schedule here; schedule is per offering)
CREATE TABLE classroom (
  classroom_id   VARCHAR(32) PRIMARY KEY,
  location       VARCHAR(255),
  duration_weeks INT,
  capacity       INT,
  is_online      BOOLEAN   NOT NULL DEFAULT FALSE,
  zoom_link      TEXT,
  is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LESSON_CLASSROOM (offering)
CREATE TABLE lesson_classroom (
  lesson_classroom_id SERIAL PRIMARY KEY,
  lesson_id           VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  classroom_id        VARCHAR(32) NOT NULL REFERENCES classroom(classroom_id) ON DELETE RESTRICT,
  director_id         INT NOT NULL REFERENCES instructor_profile(instructor_profile_id) ON DELETE RESTRICT,
  day_of_week         VARCHAR(16),
  time_start          TIME,
  time_end            TIME,
  duration_minutes    INT,
  linked_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lesson_classroom_pair UNIQUE (lesson_id, classroom_id)
);

-- LESSON_ENROLLMENT
CREATE TABLE lesson_enrollment (
  lesson_enrollment_id SERIAL PRIMARY KEY,
  lesson_id            VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  student_id           INT         NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE CASCADE,
  enrolled_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lesson_enrollment UNIQUE (lesson_id, student_id)
);

-- CLASSROOM_ENROLLMENT (now links to offering)
CREATE TABLE classroom_enrollment (
  classroom_enrollment_id SERIAL PRIMARY KEY,
  lesson_classroom_id     INT NOT NULL REFERENCES lesson_classroom(lesson_classroom_id) ON DELETE CASCADE,
  student_id              INT NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE CASCADE,
  enrolled_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_classroom_enrollment UNIQUE (lesson_classroom_id, student_id)
);

-- LESSON_READING
CREATE TABLE lesson_reading (
  reading_id  SERIAL PRIMARY KEY,
  lesson_id   VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  url         TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- STUDENT_READING
CREATE TABLE student_reading (
  student_reading_id SERIAL PRIMARY KEY,
  reading_id         INT NOT NULL REFERENCES lesson_reading(reading_id) ON DELETE CASCADE,
  student_id         INT NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE CASCADE,
  is_completed       BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_student_reading UNIQUE (reading_id, student_id)
);

-- LESSON_ASSIGNMENT
CREATE TABLE lesson_assignment (
  assignment_id SERIAL PRIMARY KEY,
  lesson_id     VARCHAR(32) NOT NULL REFERENCES lesson(lesson_id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  points        INT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- STUDENT_ASSIGNMENT
CREATE TABLE student_assignment (
  student_assignment_id SERIAL PRIMARY KEY,
  assignment_id         INT NOT NULL REFERENCES lesson_assignment(assignment_id) ON DELETE CASCADE,
  student_id            INT NOT NULL REFERENCES student_profile(student_profile_id) ON DELETE CASCADE,
  is_completed          BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_student_assignment UNIQUE (assignment_id, student_id)
);

-- =========================================================
-- 3) INDEXES
-- =========================================================

-- lookups
CREATE INDEX IF NOT EXISTS idx_student_user_id            ON student_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_user_id         ON instructor_profile(user_id);

-- course
CREATE INDEX IF NOT EXISTS idx_course_owner               ON course(owner_instructor_id);

-- lesson
CREATE INDEX IF NOT EXISTS idx_lesson_course              ON lesson(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_status              ON lesson(status);
CREATE INDEX IF NOT EXISTS idx_lesson_created_by          ON lesson(created_by);
CREATE INDEX IF NOT EXISTS idx_lesson_designer            ON lesson(designer_id);

-- lesson prerequisites
CREATE INDEX IF NOT EXISTS idx_prereq_lesson              ON lesson_prerequisite(lesson_id);
CREATE INDEX IF NOT EXISTS idx_prereq_requires            ON lesson_prerequisite(prereq_lesson_id);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollment_course          ON enrollment(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student         ON enrollment(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_enr_student         ON lesson_enrollment(student_id);

-- offering & classroom enrollment
CREATE INDEX IF NOT EXISTS idx_lc_lesson                  ON lesson_classroom(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lc_classroom               ON lesson_classroom(classroom_id);
CREATE INDEX IF NOT EXISTS idx_lc_director                ON lesson_classroom(director_id);
CREATE INDEX IF NOT EXISTS idx_lc_day_time                ON lesson_classroom(day_of_week, time_start);

CREATE INDEX IF NOT EXISTS idx_classroom_enr_lc           ON classroom_enrollment(lesson_classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enr_student      ON classroom_enrollment(student_id);

-- readings & assignments
CREATE INDEX IF NOT EXISTS idx_reading_lesson             ON lesson_reading(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_reading_student    ON student_reading(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_lesson          ON lesson_assignment(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_assignment_student ON student_assignment(student_id);

-- =========================================================
-- Notes:
-- -> Business rule: student must be enrolled in the *lesson*
--    before enrolling in a *lesson_classroom* of that lesson.
--    Enforce via trigger or application logic.
-- =========================================================
