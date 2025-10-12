import { useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentMyLessonsPage.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api";

export default function StudentMyLessonsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const course = location.state?.course;

    useEffect(() => {
        let cancelled = false;

        async function checkCourses() {
            try {
                const res = await api.get("/courses/frontend/");
                if (
                    !cancelled &&
                    Array.isArray(res.data) &&
                    res.data.length > 0
                ) {
                    // Instructor has at least one course — go to the list view
                    navigate("/student/my-lesson", { replace: true });
                }
                // else: stay on this page and show "No courses yet"
            } catch (err) {
                // Silently fail and keep user here; you can log if you want
                console.error("Failed to check courses", err);
            }
        }

        checkCourses();
        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return (
        <div className={i.wrap}>
            <div className={i.topBar}>
                <StudentTopBar />
            </div>
            <header className={i.header}>
                <h1 className={i.title}>MY LESSONS</h1>
                <div className={i.rect}>
                    <div className={i.label}>
                        <strong>
                            {course
                                ? course.course_title
                                : "Bachelor of Computer Science"}
                        </strong>
                    </div>
                    <div className={i.label1}>
                        <span>
                            Code:{" "}
                            <span>{course ? course.course_id : "C2100"}</span>
                        </span>
                        <span>
                            {course ? course.course_credits : "30"}{" "}
                            <span>Credits</span>
                        </span>
                    </div>
                </div>
            </header>
            <header className={i.header}>
                <Button
                    variant="blue"
                    className={i.enrollBtn}
                    onClick={() => navigate("/student/lesson-enrollment")}
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
                <div className={i.rect1}>
                    <div className={i.label2}>
                        <strong>Ongoing</strong>
                    </div>
                </div>
            </header>

            <section className={i.card}>
                <p className={i.emptyText}>
                    No enrolled lessons in this course yet.
                    <br />
                </p>

                <div className={i.ctaRow}>
                    <Button
                        variant="blue"
                        className={i.enrollBtn}
                        onClick={() => navigate(`/student/course/:courseId/lesson-creation/:lessonId`)}
                    >
                        <span>First time enrollment</span>
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
        </div>
    );
}

///student//student/course/${course.course_id}/lesson-creation/${course.course_id}
