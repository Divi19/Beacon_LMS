import s from "./InstructorCourseList.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InstructorCourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/courses/frontend/")
      .then((res) => {
        console.log("API response", res.data);
        setCourses(res.data);
      })
      .catch((err) => console.error("Error fetching data", err));
  }, []);

  return (
    <div>
      <InstructorTopBar />
      <div className={s.wrap}>
        <header className={s.header}>
          <div className={s.left}>
            <h1 className={s.title}>COURSE</h1>
          </div>
          <div className={s.right}>
            <Button
              variant="orange"
              className={s.enrollBtn}
              onClick={() => navigate("/instructor/course-create")}
            >
              <span>Create Course</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="#6ac3d1ff"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={s.arrow}
              >
                <circle cx="12" cy="12" r="10" fill="#278d9cff" />
                <line
                  x1="12"
                  y1="6"
                  x2="12"
                  y2="18"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                ></line>
                <line x1="6" y1="12" x2="18" y2="12"></line>
              </svg>
            </Button>
          </div>
        </header>
        <div className={s.container}>
          {courses.map((course, idx) => (
            <div
              key={idx}
              className={s.card}
              onClick={() => navigate(`/instructor/course/${course.course_id}`)}
              style={{ cursor: "pointer" }}
            >
              <h2 className={s.cardTitle}>{course.course_title}</h2>
              <div className={s.cardDesc1}>
                <div className={s.leftGroup}>
                  <span>Code:</span>
                  <span className={s.spacing}>
                    <strong>{course.course_id}</strong>
                  </span>
                </div>
                <span>
                  <strong>{course.course_credits}</strong> Credits
                </span>
              </div>
              <div className={s.cardDesc2}>
                <span>Course Director:</span>
                <span>
                  <strong>{course.course_director}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
