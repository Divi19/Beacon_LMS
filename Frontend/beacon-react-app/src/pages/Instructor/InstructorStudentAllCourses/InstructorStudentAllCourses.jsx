import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentAllCourses.module.css";
import Button from "../../../components/Button/Button";
import { api } from "../../../api";
export default function InstructorStudentAllCourses() {
    const { courseId, studentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [courses, setCourses] = useState([]);


    // Populate studentCourses state
    useEffect(() => {
        try {
            api.get(`instructor/student/progress/${studentId}/`).then(
                res => {
                            setStudent(res.data.student)
                            setLessons(res.data.lessons)
                            setCourses(res.data.courses)
                        }
                      )
            setLoading(false)
                     
                     } catch (err) {
                      const detail = err?.response?.data?.detail;
                      console.error("Error:", detail);
                      alert(detail || "An error occured. Please try again.");
                }
    }, []);

    if (loading) return <div>Loading courses details…</div>;
    if (!courses) return <div>No course found.</div>;

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
                            STUDENT PROGRESS - STUDENT
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
                        <div className={s.cardTitle}>Courses Enrolled</div>
                        {courses.length === 0 ? (
                            <div>No enrolled courses found.</div>
                        ) : (
                            courses.map(course => (
                                <div
                                    key={course.course_id}
                                    className={s.card2}
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        navigate(
                                            `/instructor/student-course/${course.course_id}/lessons/${studentId}`,
                                        )
                                    }
                                >
                                    <div className={s.cardTitleRow}>
                                        <div className={s.cardTitle}>
                                            <strong>{course.course_id}</strong>{" "}
                                            - {course.title}
                                        </div>
                                        <div className={s.enrolledAt}>
                                            Enrolled at:{" "}
                                            <strong>
                                                {course.enrolled_at}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className={s.courseBody}>
                                        <div className={s.progressWrapper}>
                                            <div className={s.progressBar}>
                                                <div
                                                    className={s.progressFill}
                                                    style={{
                                                        width: `${course.progress_percentages}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className={s.progressText}>
                                                {Math.round(
                                                   course.progress_percentages
                                                )}
                                                % Completion
                                            </span>
                                            <div className={s.lessonsText}>
                                                Lessons:{" "}
                                                <strong>
                                                    {course.lessons_done}/
                                                    {course.tot_lessons}
                                                </strong>{" "}
                                                completed
                                            </div>
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
