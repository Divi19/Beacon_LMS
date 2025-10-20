import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import s from "./InstructorStudentList.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import { api } from "../../../api";

export default function InstructorStudentLsnClass() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lessons");
  const [course, setCourse] = useState({});
  const [lessons, setLessons] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null); // for lesson/classroom details
  const [students, setStudents] = useState([]);

  // Dummy values used for now for frontend(to replace with backend later)
  useEffect(() => {
    setCourse({
      course_id: courseId,
      title: "Bachelor of Mathematics",
      credits: 20,
      students_enrolled: 25,
    });
    setLessons([
      { lesson_id: "C2231", title: "Advanced Statistics", credits: 10, students_enrolled: 10 },
      { lesson_id: "A2231", title: "Algebra II", credits: 10, students_enrolled: 19 },
      { lesson_id: "F2231", title: "Film Studies", credits: 10, students_enrolled: 4 },
    ]);
    setClassrooms([
      { classroom_id: "CS1213", name: "Mindengine", day: "Monday", time: "12:00 - 14:00", students_enrolled: 3 },
      { classroom_id: "CR4782", name: "Active Classroom 124", day: "Tuesday", time: "15:00 - 16:00", students_enrolled: 10 },
      { classroom_id: "MS123", name: "Collaborative Class", day: "Friday", time: "10:00 - 12:00", students_enrolled: 6 },
    ]);
  }, [courseId]);

  const handleViewStudents = (item) => {
    setSelected(item);
    // Dummy for now
    setStudents([
      { first_name: "James", last_name: "Jonas Andreas", student_id: "34794178", email: "jamjon@beacon.edu", title: "Mr" },
      { first_name: "Samatha", last_name: "Jonas Andreas", student_id: "34794178", email: "jamjon@beacon.edu", title: "Ms" },
    ]);
  };

  return (
    <div className={s.page}>
      <InstructorTopBar />
      <h1 className={s.pageTitle}>
        STUDENTS <span className={s.subtitle}>per course and classrooms</span>
      </h1>

      <div className={s.courseHeader}>
        <h2 className={s.courseTitle}>{course.title}</h2>
        <p>
          Code: {course.course_id} {course.credits} Credits &nbsp; Students enrolled:{" "}
          {course.students_enrolled}
        </p>
        <button className={s.orangeBtn} onClick={() => navigate(`/instructor/students/course/${courseId}`)}>
          Back to courses in students →
        </button>
      </div>

      <div className={s.tabRow}>
        <button
          className={`${s.tab} ${activeTab === "lessons" ? s.tabActive : ""}`}
          onClick={() => {
            setActiveTab("lessons");
            setSelected(null);
            setStudents([]);
          }}
        >
          Lessons
        </button>
        <button
          className={`${s.tab} ${activeTab === "classrooms" ? s.tabActive : ""}`}
          onClick={() => {
            setActiveTab("classrooms");
            setSelected(null);
            setStudents([]);
          }}
        >
          Classrooms
        </button>
      </div>

      {!selected ? (
        <div className={s.listBlock}>
          <h3>{activeTab === "lessons" ? "Lessons" : "Classrooms"}</h3>
          {(activeTab === "lessons" ? lessons : classrooms).map((item) => (
            <div className={s.cardSmall} key={item.lesson_id || item.classroom_id}>
              <div>
                <h4>{item.title || item.name}</h4>
                <p>
                  {activeTab === "lessons"
                    ? `Code: ${item.lesson_id} ${item.credits} Credits Students enrolled: ${item.students_enrolled}`
                    : `${item.day} ${item.time} Students enrolled: ${item.students_enrolled}`}
                </p>
              </div>
              <button className={s.smallBtn} onClick={() => handleViewStudents(item)}>
                Students →
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={s.studentBlock}>
          <div className={s.sectionHeader}>
            <div className={s.sectionHighlight}>
              <h4>{selected.title || selected.name}</h4>
              <p>
                {activeTab === "lessons"
                  ? `Code: ${selected.lesson_id} ${selected.credits} Credits Students enrolled: ${selected.students_enrolled}`
                  : `${selected.day} ${selected.time} Students enrolled: ${selected.students_enrolled}`}
              </p>
            </div>
            <button
              className={s.smallBtn}
              onClick={() => {
                setSelected(null);
                setStudents([]);
              }}
            >
              Back to {activeTab} →
            </button>
          </div>

          <h3>Students</h3>
          {students.length === 0 ? (
            <p className={s.emptyText}>No student enrolled yet.</p>
          ) : (
            students.map((st, i) => (
              <div key={i} className={s.studentCard}>
                <p><strong>First name:</strong> {st.first_name}</p>
                <p><strong>Last name:</strong> {st.last_name}</p>
                <p><strong>Student ID:</strong> {st.student_id}</p>
                <p><strong>Student Email:</strong> {st.email}</p>
                <p><strong>Student Title:</strong> {st.title}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
