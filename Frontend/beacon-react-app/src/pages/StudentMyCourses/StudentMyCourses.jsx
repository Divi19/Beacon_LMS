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
  const [enrolled, setEnrolled] = useState([])
  //Dummy value
  const student_id = 1 
  
  useEffect( () => {
  axios.get(`http://localhost:8000/courses/frontend/${student_id}/student/my_courses/`)
    .then(res => {
      // normalize each item to what CourseCard expects
      const normalized = (res.data || []).map(d => ({
        // make sure these keys exist for the card:
        id: d.id ?? d.course_id,
        title: d.name ?? d.title ?? d.course_title,
        code: d.code ?? d.course_code,
        description: d.description ?? d.desc ?? "",
        // keep original fields too, if the card uses others
        ...d,
      }));
      setEnrolled(normalized);
    })
    .catch(err => 
      console.error('Error fetching data', err));
    }, []);

    return (
      <>
        <StudentTopBar />
        <div className={s.wrap}>
          <header className={s.header}>
            <h1 className={s.title}>MY COURSES</h1>
          </header>
  
          {enrolled.length === 0 ? (
            <section className={s.card}>
              <p className={s.emptyText}>
                No enrolled courses yet.
                <br />
                Go to enrollment to see all available courses to enrol.
              </p>
              <div className={s.ctaRow}>
                <Button
                  variant="aqua"
                  className={s.enrollBtn}
                  onClick={() => navigate("/student/enrollment")}
                >
                  <span>Enrollment</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 8 16 12 12 16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </Button>
              </div>
            </section>
          ) : (
            <section className={s.grid}>
              {enrolled.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  ctaText="View"
                  onClick={() => {
                    // To implement in the future
                    console.log("Viewing course:", c.id);
                  }}
                />
              ))}
            </section>
          )}
        </div>
      </>
    );
  }
  