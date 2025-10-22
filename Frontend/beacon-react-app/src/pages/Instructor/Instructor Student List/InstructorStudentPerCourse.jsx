import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import s from "./InstructorStudentList.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import { api } from "../../../api";

export default function InstructorStudentPerCourse() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Dummy for now
    /**
     *  course_id: "C2100",
        title: "Bachelor of Computer Science Advanced",
        credits: 20,
        students_enrolled: 25,
     */
    try {
      api.get("/instructor/courses/").then(
        res => setCourses(res.data)
      )
    } catch (err) {
      console.error("Error showing courses:", err);
      alert("Error showing courses. Please try again.");
    }

    // Future integration:
    // const { data } = await api.get("/instructor/courses/");
    // setCourses(data);
  }, []);

  return (
    <div className={s.page}>
      <InstructorTopBar />
      <div className={s.container}>
        <h1 className={s.pageTitle}>
          STUDENTS <span className={s.subtitle}>per course</span>
        </h1>

        {courses.length === 0 ? (
          <p className={s.emptyText}>No courses available.</p>
        ) : (
          courses.map((c) => (
            <div className={s.card} key={c.course_id}>
              <div>
                <h2 className={s.courseTitle}>{c.course_title}</h2>
                <p className={s.meta}>
                  Code: {c.course_id} &nbsp; {c.course_credits} Credits &nbsp; Students
                  enrolled: {c.enrolled_count}
                </p>
              </div>
              <button
                className={s.orangeBtn}
                onClick={() =>
                  navigate(`/instructor/students/course/${c.course_id}`)
                }
              >
                View Course students →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
