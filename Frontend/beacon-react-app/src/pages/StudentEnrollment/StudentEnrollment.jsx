import React, {useEffect, useState} from 'react';

import { useNavigate } from "react-router-dom";
import axios from 'axios'
import StudentTopBar from "../../components/StudentTopBar/StudentTopBar";
import { useEnrollment } from "../../state/EnrollmentContext";
import allCourses from "../../data/courses";
import CourseCard from "../../components/CourseCard/CourseCard";
import s from "./StudentEnrollment.module.css";


export default function StudentEnrollment() {
  //const { isEnrolled } = useEnrollment();
  const navigate = useNavigate();
  //Dummy value
  const student_id = 1 
  //const available = allCourses.filter((c) => !isEnrolled(c.id));
  const [unenrolled, setUnenrolled] = useState([])
  const [submittingId, setSubmittingId] = useState(null);
  const [isLoading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      await axios.get(`http://localhost:8000/courses/frontend/${student_id}/student/enrollment/`).then(
        res => {
          // normalize each item to what CourseCard expects
          setUnenrolled(res.data);
        }
      )
    } catch (err) {
      console.error("Error fetching unenrolled courses", err);
      alert("Failed to load available courses.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setSubmittingId(courseId);
      await axios.post( `http://localhost:8000/courses/frontend/${student_id}/student/enroll/`, {
        course_id: courseId,
      });
      await fetchCourses(); // refresh after write so UI stays correct
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "Student already enrolled") {
        await fetchCourses();
      } else {
        console.error("Enrollment failed", err);
        alert(detail || "Failed to enroll in course.");
      }
    } finally {
      setSubmittingId(null);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);


  return (
    <>
      <StudentTopBar />
      <div className={s.wrap}>
        <header className={s.header}>
          <h1 className={s.title}>COURSE ENROLLMENT</h1>
        </header>

        <section className={s.grid}>
          {unenrolled.map((raw) => {
            const id    = raw.course_id;
            const title = raw.course_title ?? "Untitled";
            const code  = raw.course_id ?? "";
            const desc  = raw.course_description ?? "";
            
            return <CourseCard
              key={id}
              id={id}
              title={title}
              code={code}
              description={desc}
              onClick={() => navigate(`/student/enrollment/${id}`)}
              onCta={() => !isLoading && handleEnroll(id)}
              ctaText={isLoading ? "Enrolling…" : "Enroll"}
            />
          })}
          {unenrolled.length === 0 && (
            <div className={s.empty}>
              You're enrolled in all available courses{" "}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
