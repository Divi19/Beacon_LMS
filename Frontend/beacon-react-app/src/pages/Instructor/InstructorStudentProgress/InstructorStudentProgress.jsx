import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../../components/Button/Button";
import s from "./InstructorStudentProgress.module.css";
import { api } from "../../../api";


export default function InstructorStudentProgress() {
    const { instructorId } = useParams(); //ignored 
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock frontend data
        const fetchCourses = async () => {
            setLoading(true);
            try {
                          api.get(`/instructor/courses/`).then(
                            res => setCourses(res.data)
                          )
                         
                } catch (err) {
                          const detail = err?.response?.data?.detail;
                          console.error("Error showing courses:", err);
                          alert(detail || "Error showing courses. Please try again.");
                } finally {
                    setLoading(false)
                }
        };
        fetchCourses();
    }, [instructorId]);

    if (loading) return <div>Loading courses…</div>;
    if (courses.length === 0) return <div>No courses found.</div>;

    return (
        <div className={s.wrap}>
            <InstructorTopBar />
            <header className={s.header}>
                <div className={s.left}>
                    <h1 className={s.title}>STUDENT PROGRESS - COURSES</h1>
                </div>
                <div className={s.right}></div>
            </header>

            <div className={s.container}>
                {courses.map(c => (
                    <div
                        key={c.course_id}
                        className={s.card}
                        onClick={() => navigate(`/instructor/course/${c.course_id}/progress`)}
                    >
                        <div className={s.cardTitle}>{c.course_title}</div>

                        <div className={s.cardDesc1}>
                            <span>Code: <strong>{c.course_id}</strong></span>
                            <span style={{ marginLeft: "20px" }}>
                                Credit: <strong>{c.course_credits}</strong>
                            </span>
                        </div>

                        <div
                            className={s.cardDesc2}
                            style={{
                                flexDirection: "column",
                                alignItems: "flex-start",
                            }}
                        >
                            <span>Director: <strong>{c.course_director}</strong></span>
                            <span style={{ marginLeft: 0 }}>Status: <strong>{c.status}</strong></span>
                        </div>

                        <div className={s.cardDesc2}>
                            <span>Average Progress:</span>
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginLeft: "8px"
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
                                            width: `${(c.avg_completed)/(c.tot_lessons) * 100}%`,
                                            background: "var(--brand-inst-progressbar)",
                                            height: "100%",
                                        }}
                                    />
                                </div>
                                <span>
                                    {Math.round(
                                        (c.avg_completed)/(c.tot_lessons) * 100
                                    )}
                                    %
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
