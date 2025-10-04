import React, {useEffect, useState} from 'react';

import { useNavigate } from "react-router-dom";
import axios from 'axios'
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { useEnrollment } from "../../../state/EnrollmentContext";
import allCourses from "../../../data/courses";
import CourseCard from "../../../components/CourseCard/CourseCard";
import s from "./StudentEnrollment.module.css";
import { api } from "../../../api";

export default function StudentEnrollment() {
  const { isEnrolled } = useEnrollment();
  const navigate = useNavigate();
  //Dummy value
  const student_id = localStorage.getItem("studentId")
  //const available = allCourses.filter((c) => !isEnrolled(c.id));
  const [unenrolled, setUnenrolled] = useState([])
  const [submittingId, setSubmittingId] = useState(null);

  const fetchCourses = async () => {

    try {
      const res = await api.get(`/student/courses/unenrolled/`);
          setUnenrolled(res.data);
    } catch (err) {
      console.error("Error fetching unenrolled courses", err);
      alert("Failed to load available courses.");
    } 
  };

  const handleEnroll = async (courseId) => {
    try {
      setSubmittingId(courseId);
      await api.post( `/student/${student_id}/courses/enroll/`, {
        course_id: courseId,
      });
      fetchCourses(); // refresh after write so UI stays correct (the number of unenrolled)
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

// export default function StudentEnrollment() {
//   //const { isEnrolled } = useEnrollment();
//   const navigate = useNavigate();
//   //Dummy value
//   const student_id = 1 
//   //const available = allCourses.filter((c) => !isEnrolled(c.id));
//   const [unenrolled, setUnenrolled] = useState([])
//   const [submittingId, setSubmittingId] = useState(null);

//   const fetchCourses = async () => {
//     try {
//       await axios.get(`http://localhost:8000/courses/frontend/${student_id}/student/enrollment/`).then(
//         res => {
//           setUnenrolled(res.data);
//         }
//       )
//     } catch (err) {
//       console.error("Error fetching unenrolled courses", err);
//       alert("Failed to load available courses.");
//     } 
//   };

  // const handleEnroll = async (courseId) => {
  //   try {
  //     setSubmittingId(courseId);
  //     await axios.post( `http://localhost:8000/courses/frontend/${student_id}/student/enroll/`, {
  //       course_id: courseId,
  //     });
  //     await fetchCourses(); // refresh after write so UI stays correct
  //   } catch (err) {
  //     const detail = err?.response?.data?.detail;
  //     if (detail === "Student already enrolled") {
  //       await fetchCourses();
  //     } else {
  //       console.error("Enrollment failed", err);
  //       alert(detail || "Failed to enroll in course.");
  //     }
  //   } finally {
  //     setSubmittingId(null);
  //   }
  // };

  // useEffect(() => {
  //   fetchCourses();
  // }, []);


  return (
    <>
      <StudentTopBar />
      <div className={s.wrap}>
        <header className={s.header}>
          <h1 className={s.title}>COURSE ENROLLMENT</h1>
        </header>

        <section className={s.grid}>
          {unenrolled.map((c) => {
            return <CourseCard
              key={c.course_id}
              course={{
                code: c.course_id,
                title: c.course_title,
                credits: c.course_credits,
                director: c.course_director,
                description: c.course_description,
              }}
              onClick={() => navigate(`/student/enrollment/${c.course_id}`)}
              onCta={() => handleEnroll(c.course_id)}
              ctaText={submittingId === c.course_id ? "Enrolling…" : "Enroll"}
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
