import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentProgressDetail.module.css";
import Button from "../../../components/Button/Button";
import { api } from "../../../api";

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
        const willOpen = activeTab !== "lessons"; //ignored 
        setActiveTab(willOpen ? "lessons" : null); 
    };

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const res = await api.get(`instructor/course/progress/${courseId}`);
                      setLessons(res.data.lessons);
                      setStudents(res.data.students)
                      setCourse(res.data.course);

             
            } catch (err) {
                const errorMessage = 
                    (err?.response?.data?.detail && typeof err.response.data.detail === 'string')
                    ? err.response.data.detail
                    : "An unexpected error occurred. Please try again.";
                console.error("Failed to fetch course details", errorMessage);
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
        sortHighToLow ? a.lessons_completed - b.lessons_completed :  b.lessons_completed - a.lessons_completed ,
    );

    const sortedLessons = [...lessons].sort((a, b) => {
        const key = "avg_done";
        return sortHighToLow ?  a[key] - b[key] : b[key] - a[key] ;
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
                    <div className={s.cardTitle}>{course.title}</div>

                    <div className={s.cardDesc1}>
                        <span>Code: {course.course_id}</span>
                        <span style={{ marginLeft: "20px" }}>
                            Credits: {course.credits}
                        </span>
                        <span style={{ marginLeft: "20px" }}>
                            Students: {course.enrolled_count}
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
                background: "var(--brand-inst-primary-orange)",
                borderRadius: "8px",
                overflow: "hidden",
                marginLeft: "8px",
            }}
        >
            <div
                style={{
                    width: `${course.avg_percentages}%`,
                    background: "var(--brand-inst-progressbar)",
                    height: "100%",
                }}
            />
        </div>
        <span>{Math.round(course.avg_percentages)}%</span>
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
                        <h2 className={s.label}>Students</h2>
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
                            key={student.student_profile_id}
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
                                navigate(
                                    `/instructor/student-progress-detail/${student.student_profile_id}`,
                                );
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
                                        {student.student_no} - {student.first_name + " " + student.last_name}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "var(--brand-inst-label)",
                                        }}
                                    >
                                        {student.email}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "var(--brand-inst-label)",
                                        }}
                                    >
                                        Lessons Completed:{" "}
                                        {student.lessons_completed}/
                                        {course.tot_lessons || 0}
                                        
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            color: "var(--brand-inst-label)",
                                        }}
                                    >
                                        Credits Earned:{" "}
                                        {student.credits_earned}/
                                        {course.credits}
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
                                            background: "var(--brand-inst-primary-orange)",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${(student.lessons_completed / course.tot_lessons || 0) * 100}%`,
                                                height: "100%",
                                                background: "var(--brand-inst-progressbar)",
                                            }}
                                        />
                                    </div>
                                    <span>
                                        {Math.round(
                                            (student.lessons_completed / course.tot_lessons || 0) * 100,
                                        )}
                                        %
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "13px",
                                        color: "brown",
                                        marginTop: "6px",
                                        fontStyle: "italic",
                                    }}
                                >
                                    Enrolled: {student.enrolled_at}
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
                                        `/instructor/lesson-progress/course/${course.course_id}/lesson/${lesson.lesson_id}`,
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
                                            color: "var(--brand-inst-label)",
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
                                            color: "var(--brand-inst-label)",
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
                                                background: "var(--brand-inst-primary-orange)",
                                                borderRadius: "8px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${(lesson.lesson_progress_percentage)}%`,
                                                    height: "100%",
                                                    background: "var(--brand-inst-progressbar)",
                                                }}
                                            />
                                        </div>
                                        <span>
                                            {Math.round(
                                               lesson.lesson_progress_percentage
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
