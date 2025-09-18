-- Switch default schema
SET search_path = public;

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

