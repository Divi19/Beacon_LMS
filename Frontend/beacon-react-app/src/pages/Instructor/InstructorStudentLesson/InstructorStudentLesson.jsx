import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentLesson.module.css";
import Button from "../../../components/Button/Button";

export default function InstructorStudentLesson() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [studentCourses, setStudentCourses] = useState([]);

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
        enrolledCourses = [],
    } = location.state || {};

    // Populate studentCourses state
    useEffect(() => {
        const formattedCourses = (
            enrolledCourses.length
                ? enrolledCourses
                : [
                      // Mock courses
                      {
                          courseCode: "CS101",
                          courseTitle: "Intro to Computer Science",
                          enrolledDate: "2025-09-01",
                          progress: 0.65, // 65% completed
                          lessonsCompleted: 5,
                          totalLessons: 8,
                      },
                      {
                          courseCode: "DS201",
                          courseTitle: "Data Structures",
                          enrolledDate: "2025-09-10",
                          progress: 0.4, // 40% completed
                          lessonsCompleted: 4,
                          totalLessons: 10,
                      },
                  ]
        ).map(course => ({
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            enrolledDate: course.enrolledDate,
            progress: course.progress || 0,
            lessonsCompleted: course.lessonsCompleted || 0,
            totalLessons: course.totalLessons || 0,
        }));

        setStudentCourses(formattedCourses);
    }, []);

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

    // Mock fetch course data
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
                    course_director: "Dr. Smith",
                };
                setCourse(mockCourse);
                setStudents([]); // Mock empty student list
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
                            STUDENT PROGRESS - LESSONS
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
                        {lessonName}
                    </h2>
                    <span className={s.lessonCredit}>
                        ({lessonCredit} credits)
                    </span>
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

            <div className={s.container}>
                <div className={s.card1}>
                    <div>
                        <div className={s.cardTitle}>Courses Enrolled</div>
                        {studentCourses.length === 0 ? (
                            <div>No enrolled courses found.</div>
                        ) : (
                            studentCourses.map(course => (
                                <div
                                    key={course.courseCode}
                                    className={s.card2}
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        navigate(
                                            `/instructor/student-course/${course.courseCode}/lessons`,
                                            {
                                                state: {
                                                    studentName,
                                                    studentGmail,
                                                    studentId,
                                                    enrolledDate,
                                                    enrolledHour,
                                                    courseName:
                                                        course.courseTitle,
                                                    courseCode:
                                                        course.courseCode,
                                                    lessonCredit:
                                                        course.lessonCredit,
                                                },
                                            },
                                        )
                                    }
                                >
                                    <div className={s.cardTitleRow}>
                                        <div className={s.cardTitle}>
                                            <strong>{course.courseCode}</strong>{" "}
                                            - {course.courseTitle}
                                        </div>
                                        <div className={s.enrolledAt}>
                                            Enrolled at:{" "}
                                            <strong>
                                                {course.enrolledDate}{" "}
                                                {enrolledHour}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className={s.courseBody}>
                                        <div className={s.progressWrapper}>
                                            <div className={s.progressBar}>
                                                <div
                                                    className={s.progressFill}
                                                    style={{
                                                        width: `${course.progress * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className={s.progressText}>
                                                {Math.round(
                                                    course.progress * 100,
                                                )}
                                                % Completion
                                            </span>
                                            <div className={s.lessonsText}>
                                                Lessons:{" "}
                                                <strong>
                                                    {course.lessonsCompleted}/
                                                    {course.totalLessons}
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
