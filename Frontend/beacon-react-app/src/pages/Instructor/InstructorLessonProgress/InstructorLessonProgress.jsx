import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorLessonProgress.module.css";
import Button from "../../../components/Button/Button";

export default function InstructorLessonProgress() {
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

                const mockStudents = [
                    {
                        id: "S1",
                        name: "Alice Tan",
                        gmail: "alice.tan@gmail.com",
                        readings_completed: 3,
                        total_readings: 5,
                        assignments_completed: 2,
                        total_assignments: 3,
                        credits_earned: 12,
                        progress: 0.8,
                        enrolled_date: "2025-01-02",
                        session_day: "Monday",
                        session_start: "9:00",
                        session_end: "10:30",
                        building: "A",
                        enrolled_hour: "8:00",
                    },
                    {
                        id: "S2",
                        name: "Bob Lee",
                        gmail: "bob.lee@gmail.com",
                        readings_completed: 3,
                        total_readings: 5,
                        assignments_completed: 2,
                        total_assignments: 3,
                        total_lessons: 5,
                        credits_earned: 9,
                        progress: 0.6,
                        enrolled_date: "2023-01-02",
                        session_day: "Monday",
                        session_start: "9:00",
                        session_end: "10:30",
                        building: "A",
                        enrolled_hour: "8:00",
                    },
                    {
                        id: "S3",
                        name: "Chloe Wong",
                        gmail: "chloe.wong@gmail.com",
                        readings_completed: 3,
                        total_readings: 5,
                        assignments_completed: 2,
                        total_assignments: 3,
                        total_lessons: 5,
                        credits_earned: 6,
                        progress: 0.4,
                        enrolled_date: "2025-01-02",
                        session_day: "Monday",
                        session_start: "9:00",
                        session_end: "10:30",
                        building: "A",
                        enrolled_hour: "8:00",
                    },
                    {
                        id: "S4",
                        name: "Daniel Lim",
                        gmail: "daniel.lim@gmail.com",
                        readings_completed: 3,
                        total_readings: 5,
                        assignments_completed: 2,
                        total_assignments: 3,
                        total_lessons: 5,
                        credits_earned: 15,
                        progress: 1.0,
                        enrolled_date: "2023-01-02",
                        session_day: "Monday",
                        session_start: "9:00",
                        session_end: "10:30",
                        building: "A",
                        enrolled_hour: "8:00",
                    },
                ];
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
                    className={s.left}
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                    }}
                >
                    <h1 className={s.title}>STUDENT PROGRESS - LESSONS</h1>

                    <div className={s.lessonInfo}>
                        <h2 className={s.lessonName}>{lessonName}</h2>
                        <span className={s.lessonCredit}>
                            ({lessonCredit} credits)
                        </span>
                    </div>
                </div>
            </header>

            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.cardTitle}>
                        <strong>Average Progress</strong>
                    </div>

                    <div className={s.cardDesc2}>
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
                                }}
                            >
                                <div
                                    style={{
                                        width: `${avgProgress * 100}%`,
                                        background: "#1a73e8",
                                        height: "100%",
                                    }}
                                />
                            </div>
                            <span>{Math.round(avgProgress * 100)}%</span>
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
                    <Button
                        variant="orange"
                        className={s.enrollBtn}
                        onClick={() => setSortHighToLow(!sortHighToLow)}
                    >
                        Sort {sortHighToLow ? "Low → High" : "High → Low"}
                    </Button>
                </div>
            </div>

            <div className={s.studentList}>
                {sortedStudents.map(student => (
                    <div
                        key={student.id}
                        className={s.card}
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "1200px",
                            margin: "10px auto",
                            cursor: "pointer",
                        }}
                        onClick={() =>
                            navigate(
                                `/instructor/student-progress-detail/${student.id}`,
                                {
                                    state: {
                                        studentName: student.name,
                                        studentGmail: student.gmail,
                                        progress: student.progress,
                                        creditsEarned: student.credits_earned,
                                        studentId: student.id,
                                        enrolledDate: student.enrolled_date,
                                        enrolledHour: student.enrolled_hour,
                                        lessonName,
                                        lessonCredit,
                                    },
                                },
                            )
                        }
                    >
                        <div className={s.studentInfoGroup}>
                            <img
                                src="/profile_picture.png"
                                alt="Profile"
                                className={s.profileLogoTop}
                            />
                            <div className={s.studentInfoText}>
                                <span
                                    style={{
                                        fontWeight: "bold",
                                        fontSize: "20px",
                                    }}
                                >
                                    {student.id} - {student.name}
                                </span>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#555",
                                    }}
                                >
                                    {student.gmail}
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "20px",
                                        fontSize: "14px",
                                        color: "#555",
                                    }}
                                >
                                    <span>
                                        Readings Completed:{" "}
                                        {student.readings_completed}/
                                        {student.total_readings}
                                    </span>
                                    <span>
                                        Assignments Completed:{" "}
                                        {student.assignments_completed}/
                                        {student.total_assignments}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#555",
                                    }}
                                >
                                    Session: {student.session_day}{" "}
                                    {student.session_start} -{" "}
                                    {student.session_end}, Building:{" "}
                                    {student.building}
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                minWidth: "200px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        height: "12px",
                                        background: "#eee",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${(student.progress || 0) * 100}%`,
                                            height: "100%",
                                            background: "#7ad1d8",
                                        }}
                                    />
                                </div>
                                <span>
                                    {Math.round((student.progress || 0) * 100)}%
                                </span>
                            </div>
                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "#777",
                                    marginTop: "6px",
                                    fontStyle: "italic",
                                }}
                            >
                                Enrolled: {student.enrolled_date}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
