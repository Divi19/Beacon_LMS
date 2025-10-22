import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentCourse.module.css";
import Button from "../../../components/Button/Button";
import { api } from "../../../api";

export default function InstructorStudentCourse() {
    const { courseId, studentId} = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null)
    const [student, setStudent] = useState(null)
    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState([]);


    useEffect(() => {
        try {
            api.get(`instructor/student/progress/${studentId}/`, {params:{course_id : courseId}}).then(
                res => {
                            setStudent(res.data.student)
                            setLessons(res.data.lessons)
                            setCourse(res.data.course)
                        }
                      )
            setLoading(false)
            } catch (err) {
                const detail = err?.response?.data?.detail;
                console.error("Error:", detail);
                alert(detail || "An error occured. Please try again.");
            }
    }, [studentId]);

    if (loading) return <div>Loading course progress details...</div>;
    if (!course) return <div>No course found.</div>;
    return (
        <div className={s.wrap}>
            <InstructorTopBar />

            {/* Header */}
            <header className={s.header}>
                <div
                    className={s.headerTop}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <h1 className={s.title} style={{ margin: 0 }}>
                            STUDENT PROGRESS 
                        </h1>
                        <Button
                            className={s.enrollBtn}
                            onClick={() => navigate(-1)}
                        >
                            Back
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
                                <polyline points="12 8 8 12 12 16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                        </Button>
                    </div>
                </div>

                <div
                    className={s.lessonInfo}
                    style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <h2 className={s.lessonName} style={{ margin: 0 }}>
                        {course.course_id} - {course.title} (
                        {course.enrolled_count} students)
                    </h2>
                </div>
            </header>

            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.studentInfoGroup}>
                                            <img
                                                src="/profile_picture.png"
                                                alt="Profile"
                                                className={s.profileLogoTop}
                                            />
                                            <div className={s.studentInfoText}>
                    <div className={s.cardTitle}>{student.first_name + " " + student.last_name}</div>
                    <div className={s.cardDesc1}>
                        <span>
                            Email: <strong>{student.email}</strong>
                        </span>
                        <span style={{ marginLeft: "20px" }}>
                            Student ID: <strong>{student.student_no}</strong>
                        </span>
                        <span style={{ marginLeft: "20px" }}>
                            Registered at:{" "}
                            <strong>
                                {student.registered_at}
                            </strong>
                        </span>
                    </div>
                    </div>
                    </div>
                </div>
            </div>

            <div className={s.container}>
                <div className={s.card1}>
                    <div>
                        <div className={s.cardTitle}>
                            Lessons for {course.course_id} - {course.title} {" "}
                            {course.course_title}
                        </div>
                        {lessons.length === 0 ? (
                            <div>No lessons found.</div>
                        ) : (
                            lessons.map(lesson => (
                                <div
                                    key={lesson.lesson_id}
                                    className={s.card2}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className={s.cardTitleRow}>
                                        <div className={s.cardTitle}>
                                            <strong>{lesson.lesson_id}</strong>{" "}
                                            {lesson.title}
                                        </div>
                                        <div className={s.enrolledAt}>
                                            Enrolled at:{" "}
                                            <strong>{lesson.joined_at}</strong>
                                        </div>
                                    </div>

                                    <div className={s.courseBody}>
                                        <div className={s.lessonsText}>
                                            <strong>{lesson.day_of_week} &nbsp; {lesson.time_start && lesson.time_end
                                                ? `${lesson.time_start.slice(0, -3)} - ${lesson.time_end.slice(0, -3)}`
                                                : "No classroom enrolled"}</strong>
                                        </div>
                                        <div className={s.progressWrapper}>
                                            <div className={s.progressBar}>
                                                <div
                                                    className={s.progressFill}
                                                    style={{
                                                        width: `${lesson.progress * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className={s.progressText}>
                                                {Math.round(
                                                    lesson.progress * 100,
                                                )}
                                                %
                                            </span>
                                            <span className={s.lessonsText}>
                                                Readings completed:{" "}
                                                <strong>{lesson.reading_completed}/{lesson.tot_readings}</strong>
                                            </span>
                                            <span className={s.lessonsText}>
                                                Assignments completed:{" "}
                                                <strong>{lesson.asgn_completed}/{lesson.tot_asgns}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
