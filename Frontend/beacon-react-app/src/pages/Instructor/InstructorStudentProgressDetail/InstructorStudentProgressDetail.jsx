import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentProgressDetail.module.css";
import Button from "../../../components/Button/Button";

export default function InstructorCourseProgressDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock frontend data
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const mockCourse = {
                    course_id: courseId,
                    course_title:
                        courseId === "CS101"
                            ? "Intro to Computer Science"
                            : "Data Structures",
                    course_credits: courseId === "CS101" ? 3 : 4,
                    students_enrolled: courseId === "CS101" ? 25 : 30,
                    average_progress: courseId === "CS101" ? 0.45 : 0.78,
                };
                setCourse(mockCourse);
            } catch (err) {
                console.error("Failed to fetch course details", err);
                alert("Failed to load course details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) return <div>Loading course details…</div>;
    if (!course) return <div>No course found.</div>;

    return (
        <div className={s.wrap}>
            <InstructorTopBar />
            <header className={s.header}>
                <div
                    className={s.left}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <h1 className={s.title}>STUDENT PROGRESS - COURSES</h1>
                </div>
            </header>

            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.cardTitle}>{course.course_title}</div>

                    <div className={s.cardDesc1}>
                        <span>Code: {course.course_id}</span>
                        <span style={{ marginLeft: "20px" }}>
                            Credits: {course.course_credits}
                        </span>
                        <span style={{ marginLeft: "20px" }}>
                            Students: {course.students_enrolled}
                        </span>
                    </div>

                    <div className={s.cardDesc2}>
                        <span>Average Progress:</span>
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    height: "12px",
                                    background: "#eee",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    marginLeft: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${(course.average_progress || 0) * 100}%`,
                                        background: "#1a73e8",
                                        height: "100%",
                                    }}
                                />
                            </div>
                            <span>
                                {Math.round(
                                    (course.average_progress || 0) * 100,
                                )}
                                %
                            </span>
                        </div>
                    </div>
                </div>
                <div className={s.buttonStack}>
                    <Button
                        className={s.enrollBtn}
                        onClick={() => navigate("/instructor/student-progress")}
                    >
                        Back to Course Progress
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
        </div>
    );
}
