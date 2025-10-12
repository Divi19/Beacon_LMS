import s from "./InstructorCourseList.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../../../api";
import InstructorCourseCard from "../../../components/InstructorCourseCard/InstructorCourseCard";

export default function InstructorCourseList() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([
        {
            course_id: "FIT2081",
            course_title: "Mobile Application Development",
            course_credits: 6,
            course_director: "Dr. Jane Tan",
            status: "Active",
        },
        {
            course_id: "FIT1056",
            course_title: "Data Management",
            course_credits: 6,
            course_director: "Prof. Amirul Hassan",
            status: "Inactive",
        },
        {
            course_id: "FIT2002",
            course_title: "System Analysis & Design",
            course_credits: 6,
            course_director: "Dr. Liew Kim",
            status: "Active",
        },
    ]);
    const [ready, setReady] = useState(false);

    /**
     * Fetching courses
     * --Warning: ignore first 401, possibly due to rogue axios call on student's side
     */
    useEffect(() => {
        //grab item first
        const token = localStorage.getItem("accessToken");
        if (!token) {
            //If no token, go back to login
            navigate("/instructor/login", { replace: true });
            return;
        }

        (async () => {
            try {
                // hydrate user first; ensures backend sees a valid token
                await api.get("/user/");
                setReady(true);
                // then fetch courses
                const { data } = await api.get("/instructor/courses/");
                setCourses(data);
            } catch (e) {
                if (e?.response?.status === 401) {
                    // token missing/invalid/expired — clear and send to login
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    navigate("/instructor/login", { replace: true });
                } else {
                    console.error(
                        "Dashboard fetch failed:",
                        s,
                        e?.response?.data,
                    );
                }
            }
        })();
    }, [navigate]);

    if (!ready) return null;

    return (
        <div>
            <InstructorTopBar />
            <div className={s.wrap}>
                <header className={s.header}>
                    <div className={s.left}>
                        <h1 className={s.title}>COURSE</h1>
                    </div>
                    <div className={s.right}>
                        <Button
                            variant="orange"
                            className={s.enrollBtn}
                            onClick={() =>
                                navigate("/instructor/course-create")
                            }
                        >
                            <span>Create Course</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="#6ac3d1ff"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={s.arrow}
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="#278d9cff"
                                />
                                <line
                                    x1="12"
                                    y1="6"
                                    x2="12"
                                    y2="18"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                ></line>
                                <line x1="6" y1="12" x2="18" y2="12"></line>
                            </svg>
                        </Button>
                    </div>
                </header>
                <div className={s.container}>
                    {courses.map((course, idx) => {
                      return (
                        <InstructorCourseCard
                            key={course.course_id}
                            course={course}
                            isEnrolled={true}
                            ctaText="View"
                            onClick={() =>
                                navigate(`/student/course/${course.course_id}`)
                            }
                        />
                    );})}
                </div>
            </div>
        </div>
    );
}
