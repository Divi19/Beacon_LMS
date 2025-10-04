import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import CourseCard from "../../../components/CourseCard/CourseCard";
import s from "./StudentMyCourses.module.css";
import Button from "../../../components/Button/Button";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import {api} from "../../../api" 

export default function StudentEnrollmentPage() {
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState([])
  const student_id = localStorage.getItem("studentId")

  useEffect( () => {
  console.log(`[StudentEnrollmentPage] fetching courses for student_id=${student_id}`);
  api.get(`/student/my_courses/`)
    .then(res => {
      console.log("[StudentEnrollmentPage] fetch success:", res.data);
      setEnrolled(res.data)
    })
    .catch(err => 
      console.error('Error fetching data', err));
    }, [student_id, navigate]);

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
                  key={c.course_id}
                  course={{
                    code: c.course_id,
                    title: c.course_title,
                    credits: c.course_credits,
                    director: c.course_director,
                    description: c.course_description,
                  }}
                  isEnrolled={true}
                  ctaText="View"
                  onClick={() => navigate(`/student/course/${c.course_id}`)}
                  
                />
              ))}
            </section>
          )}
        </div>
      </>
    );
  }
  