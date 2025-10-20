import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import s from "./InstructorStudentList.module.css";
import { api } from "../../../api";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";

export default function InstructorStudentInCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState({});
  const [students, setStudents] = useState([]);

  useEffect(() => {

    try {
      api.get(`/courses/${courseId}/detail/`).then(
        res => setCourse(res.data)
      )
      api.get(`instructor/show/enrolled/`, {params:{course_id: courseId}}).then(
        res => setStudents(res.data.students)
      )
    } catch (err) {
      console.error("Error showing courses:", err);
      alert("Error showing courses. Please try again.");
    }
  }, [courseId]);

  return (
    <div className={s.page}>
      <InstructorTopBar />
      <div className={s.container}>
        <h1 className={s.pageTitle}>
          STUDENTS <span className={s.subtitle}>In course</span>
        </h1>

        <div className={s.courseHeader}>
          <h2 className={s.courseTitle}>{course.course_title}</h2>
          <p>
            Code: <strong>{course.course_id}</strong> &nbsp;&nbsp; {course.course_credits} Credits &nbsp; Students
            enrolled: {course.enrolled_count}
          </p>
          <div className={s.btnGroup}>
            <button
              className={s.orangeBtn}
              onClick={() => navigate("/instructor/studentlist")}
            >
              Back to courses per students →
            </button>
            <button
              className={s.orangeBtn}
              onClick={() =>
                navigate(
                  `/instructor/students/course/${courseId}/lessons-classrooms`
                )
              }
            >
              Go to course lessons and classrooms students →
            </button>
          </div>
        </div>

        <div className={s.studentBlock}>
          <h3 classname={s.meta}>Students</h3>
          {students.length === 0 ? (
            <p className={s.emptyText}>No student enrolled yet.</p>
          ) : (
            students.map((st) => (
              <div key={st.id} className={s.studentCard}>
                <p>
                  <strong classname={s.studentDet}>First name:</strong> {st.first_name}
                </p>
                <p>
                  <strong>Last name:</strong> {st.last_name}
                </p>
                <p>
                  <strong>Student ID:</strong> {st.student_no}
                </p>
                <p>
                  <strong>Student Email:</strong> {st.email_output}
                </p>
                <p>
                  <strong>Student Title:</strong> {st.title}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
