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
    const [students, setStudents] = useState([]);
    const [sortHighToLow, setSortHighToLow] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [lessonSortBy, setLessonSortBy] = useState("duration");
    const [lessonSortHighToLow, setLessonSortHighToLow] = useState(true);
    const [activeTab, setActiveTab] = useState(null);

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
                        lessons_completed: 4,
                        total_lessons: 5,
                        credits_earned: 12,
                        progress: 0.8,
                        enrolled_date: "2025-01-02"
                    },
                    {
                        id: "S2",
                        name: "Bob Lee",
                        gmail: "bob.lee@gmail.com",
                        lessons_completed: 3,
                        total_lessons: 5,
                        credits_earned: 9,
                        progress: 0.6,
                        enrolled_date: "2023-01-02"
                    },
                    {
                        id: "S3",
                        name: "Chloe Wong",
                        gmail: "chloe.wong@gmail.com",
                        lessons_completed: 2,
                        total_lessons: 5,
                        credits_earned: 6,
                        progress: 0.4,
                        enrolled_date: "2025-01-02"
                    },
                    {
                        id: "S4",
                        name: "Daniel Lim",
                        gmail: "daniel.lim@gmail.com",
                        lessons_completed: 5,
                        total_lessons: 5,
                        credits_earned: 15,
                        progress: 1.0,
                        enrolled_date: "2023-01-02"
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
                    <Button
                        variant="orange"
                        className={s.enrollBtn}
                        onClick={() => setSortHighToLow(!sortHighToLow)}
                    >
                        Sort {sortHighToLow ? "Low → High" : "High → Low"}
                    </Button>
                </div>
            </div>

            <div className={s.wraprow}>
                <div className={s.row1}>
                    <div
                        className={`${s.panel1} ${activeTab === "students" ? s.tabActive : ""}`}
                        onClick={() =>
                            setActiveTab(
                                activeTab === "students" ? null : "students",
                            )
                        }
                        style={{ cursor: "pointer" }}
                    >
                        <h2 className={s.label}>Enrolled Students</h2>
                    </div>

                    <div
                        className={`${s.panel1} ${activeTab === "lessons" ? s.tabActive : ""}`}
                        onClick={handleToggleLessons}
                        style={{ cursor: "pointer" }}
                    >
                        <h2 className={s.label}>Lessons</h2>
                    </div>
                </div>
            </div>

            {activeTab === "students" && (
                <>
                    {sortedStudents.map((student, idx) => (
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
                            onClick={() => {
                                console.log("Clicked student:", student.name);
                            }}
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
                                        {student.email ||
                                            `${student.name.toLowerCase()}@example.com`}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "#555",
                                        }}
                                    >
                                        Lessons Completed:{" "}
                                        {student.lessonsCompleted || 3}/
                                        {student.totalLessons || 5}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "#555",
                                        }}
                                    >
                                        Credits Earned:{" "}
                                        {student.creditsEarned || 5}/
                                        {course.course_credits * 10}
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
                                                background: "#1a73e8",
                                            }}
                                        />
                                    </div>
                                    <span>
                                        {Math.round(
                                            (student.progress || 0) * 100,
                                        )}
                                        %
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
                                    Enrolled:{" "}
                                    {student.enrolled_date}
                                </span>
                            </div>
                        </div>
                    ))}
                </>
            )}

            {activeTab === "lessons" && (
                <div className={s.lessonFile}>
                    {sortedLessons.length > 0 ? (
                        sortedLessons.map((lesson, idx) => (
                            <div
                                key={idx}
                                className={s.card}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    width: "1200px",
                                    margin: "10px auto",
                                }}
                                onClick={() =>
                                    navigate(
                                        `/instructor/course/${course.course_id}/lesson/${lesson.lesson_id}`,
                                    )
                                }
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: "bold",
                                            fontSize: "20px",
                                        }}
                                    >
                                        {lesson.lesson_id} - {lesson.title}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "#555",
                                        }}
                                    >
                                        Students Enrolled:{" "}
                                        {lesson.enrolled_count}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                        minWidth: "200px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            marginBottom: "4px",
                                            color: "#333",
                                        }}
                                    >
                                        Average Progress
                                    </span>

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
                                                    width: `${(lesson.average_progress || 0) * 100}%`,
                                                    height: "100%",
                                                    background: "#1a73e8",
                                                }}
                                            />
                                        </div>
                                        <span>
                                            {Math.round(
                                                (lesson.average_progress || 0) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <span className={s.noLessons}>No Lessons</span>
                    )}
                </div>
            )}
        </div>
    );
}
