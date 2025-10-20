import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../../components/Button/Button";
import s from "./InstructorStudentProgress.module.css";

export default function InstructorStudentProgress() {
    const { instructorId } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock frontend data
        const fetchCourses = async () => {
            setLoading(true);
            try {
                // Example mock courses (simulate backend for now)
                const mockCourses = [
                    {
                        course_id: "CS101",
                        course_title: "Intro to Computer Science",
                        course_credits: 3,
                        course_director: "Dr. Wong",
                        status: "Active",
                        average_progress: 0.45,
                    },
                    {
                        course_id: "CS102",
                        course_title: "Data Structures",
                        course_credits: 4,
                        course_director: "Dr. Wong",
                        status: "Active",
                        average_progress: 0.78,
                    },
                ];

                const filtered = mockCourses.filter(
                    c => instructorId === "instructor1", // example mock up (can be changed)
                );

                setCourses(filtered.length ? filtered : mockCourses);
            } catch (err) {
                console.error("Failed to load courses", err);
                alert("Failed to load courses.");
            } finally {
                setLoading(false);
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
                        onClick={() => navigate(`/course/${c.course_id}`)}
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
                                        background: "#eee",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${(c.average_progress || 0) * 100}%`,
                                            background: "#1a73e8",
                                            height: "100%",
                                        }}
                                    />
                                </div>
                                <span>
                                    {Math.round(
                                        (c.average_progress || 0) * 100,
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
