import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentLesson.module.css";
import Button from "../../../components/Button/Button";

export default function InstructorStudentLesson() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [sortHighToLow, setSortHighToLow] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [lessonSortBy, setLessonSortBy] = useState("duration");
    const [lessonSortHighToLow, setLessonSortHighToLow] = useState(true);
    const [activeTab, setActiveTab] = useState(null);
    const location = useLocation();
    const { lessonName = "Unknown Lesson", lessonCredit = 0 } =
        location.state || {};
    const {
        studentName,
        studentGmail,
        progress,
        studentId,
        enrolledDate,
        creditsEarned,
        enrolledHour,
    } = location.state || {};

    const handleToggleLessons = () => {
        const willOpen = activeTab !== "lessons";
        setActiveTab(willOpen ? "lessons" : null);

        if (willOpen) {
            const mockLessons = [
                {
                    lesson_id: "L1",
                    title: "Intro",
                    designer: "Alice",
                    duration_weeks: 2,
                    enrolled_count: 10,
                },
                {
                    lesson_id: "L2",
                    title: "Advanced",
                    designer: "Bob",
                    duration_weeks: 3,
                    enrolled_count: 12,
                },
            ];
            setLessons(mockLessons);
        }
    };

    useEffect(() => {
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
                    course_director: "Dr. Smith", // added mock director
                };
                setCourse(mockCourse);

                const mockStudents = [];
                setStudents(mockStudents);
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

    const sortedStudents = [...students].sort((a, b) =>
        sortHighToLow ? b.progress - a.progress : a.progress - b.progress,
    );

    const sortedLessons = [...lessons].sort((a, b) => {
        const key = "duration_weeks";
        return sortHighToLow ? b[key] - a[key] : a[key] - b[key];
    });
    const totalProgress = students.reduce((sum, s) => sum + s.progress, 0);
    const avgProgress = students.length ? totalProgress / students.length : 0;

    return (
        <div className={s.wrap}>
            <InstructorTopBar />
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
                            STUDENT PROGRESS - LESSONS
                        </h1>

                        <Button
                            className={s.enrollBtn}
                            onClick={() =>
                                navigate("/instructor/student-progress")
                            }
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
                        {lessonName}
                    </h2>
                    <span className={s.lessonCredit}>
                        ({lessonCredit} credits)
                    </span>
                </div>
            </header>

            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.cardTitle}>{studentName}</div>
                    <div className={s.cardDesc1}>
                        <span>
                            Email: <strong>{studentGmail}</strong>
                        </span>
                        <span style={{ marginLeft: "20px" }}>
                            Student ID: <strong>{studentId}</strong>
                        </span>
                        <span style={{ marginLeft: "20px" }}>
                            Registered at:{" "}
                            <strong>
                                {enrolledDate} {enrolledHour}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.cardTitle}>Courses Enrolled</div>
                    <div className={s.allCourses}>
                        <div className={s.cardTitle}>{studentName}</div>
                        <div className={s.cardDesc1}>
                            <span>
                                Email: <strong>{studentGmail}</strong>
                            </span>
                            <span style={{ marginLeft: "20px" }}>
                                Student ID: <strong>{studentId}</strong>
                            </span>
                            <span style={{ marginLeft: "20px" }}>
                                Registered at:{" "}
                                <strong>
                                    {enrolledDate} {enrolledHour}
                                </strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
