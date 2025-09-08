import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import CourseCard from "../../components/CourseCard/CourseCard";
import s from "./StudentMyCourses.module.css";
import Button from "../../components/Button/Button";
import StudentTopBar from "../../components/StudentTopBar/StudentTopBar";
import courses from "../../data/courses";
import { useEnrollment } from "../../state/EnrollmentContext";


export default function StudentEnrollmentPage() {
  const navigate = useNavigate();
  const studentId = 1; // replace with context/auth later
  const url = "http://127.0.0.1:8000/api";

  const [enrolled, setEnrolled] = useState([]);
  const [unenrolled, setUnenrolled] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch both enrolled and unenrolled courses
  const fetchCourses = async () => {
    try {
      setLoading(true);

      const [resEnrolled, resUnenrolled] = await Promise.all([
        axios.get(`${url}/students/${studentId}/enrolled/`),
        axios.get(`${url}/students/${studentId}/unenrolled/`),
      ]);
o
      setEnrolled(resEnrolled.data || []);
      setUnenrolled(resUnenrolled.data || []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  // Enroll in a course
  const handleEnroll = async (courseId) => {
    try {
      await axios.post(`${url}/students/${studentId}/enroll/`, { course_id: courseId });

      // Move course from unenrolled to enrolled
      const course = unenrolled.find((c) => c.id === courseId);
      if (course) {
        setEnrolled([...enrolled, course]);
        setUnenrolled(unenrolled.filter((c) => c.id !== courseId));
      }
    } catch (err) {
      console.error("Enrollment failed", err);
      alert("Failed to enroll in course.");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <p>Loading courses...</p>;

  return (
    <>
      <StudentTopBar />

      <div className={s.wrap}>
        <header className={s.header}>
          <h1 className={s.title}>COURSE ENROLLMENT</h1>
        </header>

        {/* Enrolled Courses */}
        <section className={s.section}>
          <h2>My Courses</h2>
          {enrolled.length === 0 ? (
            <p>You have not enrolled in any courses yet.</p>
          ) : (
            <div className={s.grid}>
              {enrolled.map((c) => (
                <CourseCard key={c.id} course={c} ctaText="View" onClick={() => console.log("Viewing", c.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Unenrolled Courses */}
        <section className={s.section}>
          <h2>Available Courses</h2>
          {unenrolled.length === 0 ? (
            <p>All courses are already enrolled!</p>
          ) : (
            <div className={s.grid}>
              {unenrolled.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  ctaText="Enroll"
                  onClick={() => console.log("Viewing", c.id)}
                  onCta={() => handleEnroll(c.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
