import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./AdminInstructorList.module.css";
import AdminTopBar from "../../../components/AdminTopBar/AdminTopBar";
import { api } from "../../../api";
import AdminCard from "../../../components/AdminCard/AdminCard";

export default function AdminInstructorList() {
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([
            {
                id: 1,
                title: "Ms",
                name: "Polla Clae",
                email: "polla.clae@beacon.edu",
                password: "pclae123",
                account_status: "Active",
            },
            {
                id: 2,
                title: "Mr",
                name: "Will Ed",
                email: "will.ed@beacon.edu",
                password: "wille123",
                account_status: "Active",
            },
        ]);

    useEffect(() => {
        let cancelled = false;

        async function checkCourses() {
            try {
                const res = await api.get("/courses/frontend/");
                if (
                    !cancelled &&
                    Array.isArray(res.data) &&
                    res.data.length > 0
                ) {
                    // Instructor has at least one course — go to the list view
                    navigate("/student/my-lesson", { replace: true });
                }
                // else: stay on this page and show "No courses yet"
            } catch (err) {
                // Silently fail and keep user here; you can log if you want
                console.error("Failed to check courses", err);
            }
        }

        checkCourses();
        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return (
        <div className={i.wrap}>
            <div className={i.topBar}>
                <AdminTopBar />
            </div>
            <header className={i.header}>
                <h1 className={i.title}>CREATE INSTRUCTOR</h1>
                <Button
                    variant="green"
                    className={i.enrollBtn}
                    onClick={() => navigate("/student/lesson-enrollment")}
                >
                    <span>Create Instructor</span>
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
                        <polyline points="12 8 16 12 12 16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                </Button>
            </header>

            {instructors.length === 0 ? (
                            <div className={i.noInstructor}>No instructor has been created yet.</div>
                        ) : (
                            <div className={i.grid1}>
                                {instructors.map(instructor => (
                                    <AdminCard
                                        key={instructor.id}
                                        instructor={{
                                            title: instructor.title,
                                            name: instructor.name,
                                            password: instructor.password,
                                            account_status: instructor.account_status,
                                        }}
                                        isEnrolled={true}
                                        ctaText="View"
                                        onClick={() =>
                                            navigate(`/student/lesson/${instructor.id}`)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            