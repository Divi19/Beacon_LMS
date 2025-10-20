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
                    { id: "S1", name: "Alice", progress: 0.7 },
                    { id: "S2", name: "Bob", progress: 0.4 },
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
                <div className={s.lessonsCard}>
                    <h2 className={s.lessonsLabel}>Enrolled Students</h2>
                    {sortedStudents.length > 0 ? (
                        sortedStudents.map(student => (
                            <div key={student.id} className={s.studentCard}>
                                <span>{student.name}</span>
                                <span>
                                    {Math.round(student.progress * 100)}%
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className={s.empty}>No students enrolled yet</p>
                    )}
                </div>
            )}

            {activeTab === "lessons" && (
                <div className={s.lessonsCard}>
                    <div className={s.lessonFile}>
                        {sortedLessons.length > 0 ? (
                            sortedLessons.map((lesson, idx) => (
                                <div
                                    key={idx}
                                    className={s.card}
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        navigate(
                                            `/instructor/course/${course.course_id}/lesson/${lesson.lesson_id}`,
                                        )
                                    }
                                >
                                    <h2 className={s.cardTitle}>
                                        {lesson.title}
                                    </h2>
                                    <div className={s.cardDesc1}>
                                        <div className={s.leftGroup}>
                                            <span>Code:</span>
                                            <span className={s.spacing}>
                                                <strong>
                                                    {lesson.lesson_id}
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className={s.cardDesc2}>
                                        <span>Course Director:</span>
                                        <span> {course.course_director}</span>
                                    </div>
                                    <div className={s.cardDesc2}>
                                        <span>Lesson Designer:</span>
                                        <span> {lesson.designer}</span>
                                    </div>
                                    <div className={s.cardDesc3}>
                                        <span>Duration:</span>
                                        <span>
                                            {" "}
                                            {lesson.duration_weeks} weeks
                                        </span>
                                    </div>
                                    <div className={s.cardDesc3}>
                                        <span>Enrolled Students:</span>
                                        <span> {lesson.enrolled_count}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className={s.noLessons}>No Lessons</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
