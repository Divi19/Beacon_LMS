This folder is for the frontend devlopers 

Drop and create db 
psql -u [username] -d postgres 
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='lms_db';
DROP DATABASE IF EXISTS lms_db;
CREATE DATABASE lms_db OWNER [username];
GRANT ALL PRIVILEGES ON DATABASE lms_db TO [username];