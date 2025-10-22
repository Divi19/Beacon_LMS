import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorLessonProgress.module.css";
import Button from "../../../components/Button/Button";
import { api } from "../../../api";

export default function InstructorLessonProgress() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [sortHighToLow, setSortHighToLow] = useState(true);
    const [lesson, setLesson] = useState();

    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const res =  await api.get(`/instructor/lesson/progress/${lessonId}/`)
                    setLesson(res.data.lesson)
                    setStudents(res.data.students)
            } catch (err) {
                const errorMessage = 
                    (err?.response?.data?.detail && typeof err.response.data.detail === 'string')
                    ? err.response.data.detail
                    : "An unexpected error occurred. Please try again.";
                console.error("Failed to fetch lesson details", errorMessage);
                alert(`Failed to load lesson details.`);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [courseId]);

    if (loading) return <div>Loading lesson details…</div>;

    const sortedStudents = [...students].sort((a, b) =>
        sortHighToLow ? b.tot_completed - a.tot_completed : a.tot_completed - b.tot_completed,
    );
    const avgProgress = students.length ? lesson.lesson_progress: 0;

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
                        <h2 className={s.lessonName}>{lesson.lesson_id} - {lesson.title}</h2>
                        <span className={s.lessonCredit}>
                            ({lesson.credits} credits)
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
                                    background: "var(--brand-inst-primary-orange)",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${avgProgress * 100}%`,
                                        background: "var(--brand-inst-progressbar)",
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
                        onClick={() => navigate(-1)}>
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
                        onClick={() =>
                            navigate(
                                `/instructor/student-progress-detail/${student.student_profile_id}`
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
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "20px",
                                        fontSize: "14px",
                                        color: "var(--brand-inst-label)",
                                    }}
                                >
                                    <span>
                                        Readings Completed:{" "}
                                        {student.reading_completed}/
                                        {lesson.read_count}
                                    </span>
                                    <span>
                                        Assignments Completed:{" "}
                                        {student.asgn_completed}/
                                        {lesson.asgn_count}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "var(--brand-inst-label)",
                                    }}
                                >
                                    <strong>Session: </strong>
                                    {" "}
                                    
                                    {student.session.day_of_week}{" "}
                                    {student.session.time_start.slice(0,-3)} -{" "}
                                    {student.session.time_end.slice(0,-3)} &nbsp;&nbsp;&nbsp;
                                    {student.session.location}
                                    
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
                                            width: `${(student.lesson_progress|| 0) * 100}%`,
                                            height: "100%",
                                            background: "var(--brand-inst-progressbar)",
                                        }}
                                    />
                                </div>
                                <span>
                                    {Math.round((student.lesson_progress || 0) * 100)}%
                                </span>
                            </div>
                            <span
                                style={{
                                    fontSize: "13px",
                                    color: "var(--brand-inst-label)",
                                    marginTop: "6px",
                                    fontStyle: "italic",
                                }}
                            >
                                Enrolled: {student.enrolled_at}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
