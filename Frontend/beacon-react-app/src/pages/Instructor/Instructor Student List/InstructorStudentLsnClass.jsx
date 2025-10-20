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

  useEffect(() => {
        try {
          api.get(`/courses/${courseId}/detail/`).then(
            res => setCourse(res.data)
          )
          api.get(`instructor/courses/${courseId}/lessons/`).then(
            res => setLessons(res.data)
          )
          api.get("instructor/course/classrooms/", {params:{course_id: courseId}}).then(
            res => setClassrooms(res.data)
          )
          
        } catch (err) {
          console.error("Error showing courses:", err);
          alert("Error showing courses. Please try again.");
        }

  }, [courseId]);

  const handleViewStudents = (item) => {
    setSelected(item);
    api.get(`instructor/show/enrolled/`, {params:{lesson_id: item.lesson_id}}).then(
      res => setStudents(res.data.students)
    )
  };

  return (
    <div className={s.page}>
      <InstructorTopBar />
      <h1 className={s.pageTitle}>
        STUDENTS <span className={s.subtitle}>per course and classrooms</span>
      </h1>

      <div className={s.courseHeader}>
        <h2 className={s.courseTitle}>{course.course_title}</h2>
        <p>
          Code: <strong>{course.course_id}</strong>&nbsp;&nbsp; {course.course_credits} Credits &nbsp; Students enrolled:&nbsp;{course.enrolled_count}
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
                <p>
                {activeTab === 'classrooms' && (
                    <div>
                      <strong>{item.location}</strong>
                      <p>{item.day_of_week} {item.time_start}-{item.time_end} &nbsp;&nbsp; Students enrolled: {item.enrolled_count}</p> 
                    </div>
                  )}
                  {activeTab === 'lessons' && (
                    <div>
                      <strong>{item.title}</strong>
                      <p>Code: {item.lesson_id}&nbsp; {item.credits} Credits &nbsp;&nbsp; Students enrolled: {item.enrolled_count}</p> 
                    </div>
                  )}
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
              <p>
              {activeTab === 'classrooms' && (
                    <div>
                      <strong>{selected.location}</strong>
                      <p>{selected.day_of_week} {selected.time_start}-{selected.time_end} &nbsp;&nbsp; Students enrolled: {selected.enrolled_count}</p> 
                    </div>
                  )}
                  {activeTab === 'lessons' && (
                    <div>
                      <strong>{selected.title}</strong>
                      <p>Code: {selected.lesson_id}&nbsp; {selected.credits} Credits &nbsp;&nbsp; Students enrolled: {selected.enrolled_count}</p> 
                    </div>
                  )}
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
                <p><strong>Student ID:</strong> {st.student_no}</p>
                <p><strong>Student Email:</strong> {st.email_output}</p>
                <p><strong>Student Title:</strong> {st.title}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
