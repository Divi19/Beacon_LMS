import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentOwnLessons.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api";

export default function StudentMyLessonsPage() {
    const navigate = useNavigate();

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
                <StudentTopBar />
            </div>
            <header className={i.header}>
                <h1 className={i.title}>MY LESSONS</h1>
                <div className={i.rect}>
                    <div className={i.label}>
                        <strong>Bachelor of Computer Science</strong>
                    </div>
                    <div className={i.label1}>
                        <span>
                            Code:<span> C2100</span>
                        </span>
                        <span>
                            30<span> Credits</span>
                        </span>
                    </div>
                </div>
            </header>
            <header className={i.header}>
                <Button
                    variant="blue"
                    className={i.enrollBtn}
                    onClick={() => navigate("/student/lesson-enrollment")}
                >
                    <span>Enrollment</span>
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
                <div className={i.rect1}>
                    <div className={i.label2}>
                        <strong>Ongoing</strong>
                    </div>
                </div>
            </header>

            <div className={i.grid1}>
                <div className={i.card1}>
                    <h2>Introduction to Physics</h2>
                    <div className={i.cardDesc1}>
                        <div className={i.leftGroup}>
                            <span>Code:</span>
                            <span className={i.spacing}>
                                <strong>PHY1321</strong>
                            </span>
                        </div>
                        <span>
                            <strong>2</strong> Credits
                        </span>
                    </div>

                    <div className={i.cardDesc2}>
                        <span>Course Director:</span>
                        <span>
                            <strong>Dr Charles Xavier</strong>
                        </span>
                    </div>
                    <div className={i.cardDesc2}>
                        <span>Duration:</span>
                        <span>
                            <span>
                                <strong>2</strong> Weeks
                            </span>
                        </span>
                    </div>
                </div>

                <div className={i.card1}>
                    <h2>Introduction to Physics</h2>
                    <div className={i.cardDesc1}>
                        <div className={i.leftGroup}>
                            <span>Code:</span>
                            <span className={i.spacing}>
                                <strong>PHY1321</strong>
                            </span>
                        </div>
                        <span>
                            <strong>2</strong> Credits
                        </span>
                    </div>

                    <div className={i.cardDesc2}>
                        <span>Course Director:</span>
                        <span>
                            <strong>Dr Charles Xavier</strong>
                        </span>
                    </div>
                    <div className={i.cardDesc2}>
                        <span>Duration:</span>
                        <span>
                            <span>
                                <strong>2</strong> Weeks
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
