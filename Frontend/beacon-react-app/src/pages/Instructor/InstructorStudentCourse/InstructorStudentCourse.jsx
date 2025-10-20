import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentCourse.module.css";
import Button from "../../../components/Button/Button";

export default function InstructorStudentLesson() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const {
        studentName,
        studentGmail,
        studentId,
        enrolledDate,
        enrolledHour,
        enrolledCourses = [],
    } = location.state || {};

    // Populate lessons state (instead of studentCourses)
    useEffect(() => {
        const formattedLessons = (
            enrolledCourses.length
                ? enrolledCourses
                : [
                      // Mock lessons for course
                      {
                          lessonCode: "L1",
                          lessonTitle: "Intro",
                          lessonSchedule: "Mon 09:00 - 11:00 Building A",
                          progress: 0.65,
                          readingsCompleted: 3,
                          totalReadings: 5,
                          assignmentsCompleted: 2,
                          totalAssignments: 3,
                      },
                      {
                          lessonCode: "L2",
                          lessonTitle: "Advanced",
                          lessonSchedule: "Wed 14:00 - 16:00 Building B",
                          progress: 0.4,
                          readingsCompleted: 1,
                          totalReadings: 5,
                          assignmentsCompleted: 1,
                          totalAssignments: 3,
                      },
                  ]
        ).map(lesson => ({
            lessonCode: lesson.lessonCode,
            lessonTitle: lesson.lessonTitle,
            lessonSchedule: lesson.lessonSchedule,
            progress: lesson.progress || 0,
            readingsCompleted: lesson.readingsCompleted || 0,
            totalReadings: lesson.totalReadings || 0,
            assignmentsCompleted: lesson.assignmentsCompleted || 0,
            totalAssignments: lesson.totalAssignments || 0,
        }));

        setLessons(formattedLessons);
    }, []);

    // Mock fetch course data
    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const mockCourse = {
                    course_id: courseId,
                    course_code: courseId,
                    course_title:
                        courseId === "CS101"
                            ? "Intro to Computer Science"
                            : "Data Structures",
                    students_enrolled: courseId === "CS101" ? 25 : 30,
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
                        {course.course_code} - {course.course_title} (
                        {course.students_enrolled} students)
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
                        <div className={s.cardTitle}>
                            Lessons for {course.course_code} {" "}
                            {course.course_title}
                        </div>
                        {lessons.length === 0 ? (
                            <div>No lessons found.</div>
                        ) : (
                            lessons.map(lesson => (
                                <div
                                    key={lesson.lessonCode}
                                    className={s.card2}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className={s.cardTitleRow}>
                                        <div className={s.cardTitle}>
                                            <strong>{lesson.lessonCode}</strong>{" "}
                                            {lesson.lessonTitle}
                                        </div>
                                        <div className={s.enrolledAt}>
                                            Enrolled at:{" "}
                                            <strong>{enrolledDate}</strong>
                                        </div>
                                    </div>

                                    <div className={s.courseBody}>
                                        <div className={s.lessonsText}>
                                            <strong>{lesson.lessonSchedule}</strong>
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
                                                <strong>{lesson.readingsCompleted}/{lesson.totalReadings}</strong>
                                            </span>
                                            <span className={s.lessonsText}>
                                                Assignments completed:{" "}
                                                <strong>{lesson.assignmentsCompleted}/{lesson.totalAssignments}</strong>
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
