import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentOwnLessons.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api";
import LessonDisplay from "../../../components/LessonDisplay/LessonDisplay";

export default function StudentMyLessonsPage() {
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([
        {
            id: 1,
            title: "Introduction to Physics",
            code: "PHY1321",
            credit: 2,
            director: "Dr. Charles Xavier",
            duration: 2,
        },
        {
            id: 2,
            title: "Advanced Programming",
            code: "CSC2202",
            credit: 3,
            director: "Prof. Jean Grey",
            duration: 4,
        },
    ]);
    const [ready, setReady] = useState(false);
    const [course, setCourse] = useState({
        title: "Bachelor of Computer Science",
        code: "C2100",
        credit: 30,
        status: "Ongoing",
    });

    useEffect(() => {
        let cancelled = false;

        async function checkLessons() {
            try {
                const res = await api.get("/lessons/frontend/");
                if (
                    !cancelled &&
                    Array.isArray(res.data) &&
                    res.data.length > 0
                ) {
                    // Instructor has at least one course — go to the list view
                    navigate("/student/enrollment", { replace: true });
                }
                // else: stay on this page and show "No courses yet"
            } catch (err) {
                // Silently fail and keep user here; you can log if you want
                console.error("Failed to check lessons", err);
            }
        }

        checkLessons();
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
                        <strong>{course.title}</strong>
                    </div>
                    <div className={i.label1}>
                        <span>
                            Code:<span> {course.code}</span>
                        </span>
                        <span>
                            {course.credit}
                            <span> Credits</span>
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
                        <strong>{course.status}</strong>
                    </div>
                </div>
            </header>

            {lessons.length === 0 ? (
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
            ) : (
                <div className={i.grid1}>
                    {lessons.map(lesson => (
                        <LessonDisplay
                            key={lesson.id}
                            lesson={{
                                code: lesson.code,
                                title: lesson.title,
                                credit: lesson.credit,
                                director: lesson.director,
                                duration: lesson.duration,
                            }}
                            isEnrolled={true}
                            ctaText="View"
                            onClick={() =>
                                navigate(`/student/lesson/${lesson.id}`)
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
