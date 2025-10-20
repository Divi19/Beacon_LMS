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
    setCourse({
      course_id: courseId,
      title: "Bachelor of Mathematics",
      credits: 20,
      students_enrolled: 25,
    });

    setStudents([
      {
        id: 1,
        first_name: "James",
        last_name: "Jonas Andreas",
        student_id: "34794178",
        email: "jamjon@beacon.edu",
        title: "Mr",
      },
      {
        id: 2,
        first_name: "Vincent H",
        last_name: "Hong lim wen",
        student_id: "34794178",
        email: "jamjon@beacon.edu",
        title: "Mr",
      },
      {
        id: 3,
        first_name: "Samatha",
        last_name: "Jonas Andreas",
        student_id: "34794178",
        email: "jamjon@beacon.edu",
        title: "Ms",
      },
      {
        id: 4,
        first_name: "Bowser",
        last_name: "Jack Black",
        student_id: "34794178",
        email: "jamjon@beacon.edu",
        title: "Mr",
      },
    ]);

    // API integration example:
    // const { data } = await api.get(`/instructor/courses/${courseId}/students/`);
    // setStudents(data.students);
  }, [courseId]);

  return (
    <div className={s.page}>
      <InstructorTopBar />
      <div className={s.container}>
        <h1 className={s.pageTitle}>
          STUDENTS <span className={s.subtitle}>In course</span>
        </h1>

        <div className={s.courseHeader}>
          <h2 className={s.courseTitle}>{course.title}</h2>
          <p>
            Code: {course.course_id} {course.credits} Credits &nbsp; Students
            enrolled: {course.students_enrolled}
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
                  <strong>Student ID:</strong> {st.student_id}
                </p>
                <p>
                  <strong>Student Email:</strong> {st.email}
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
