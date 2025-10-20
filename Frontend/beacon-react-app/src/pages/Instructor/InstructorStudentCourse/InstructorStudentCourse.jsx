import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorStudentCourse.module.css";
import Button from "../../../components/Button/Button";

export default function InstructorStudentCourse() {
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
    }, [enrolledCourses]);

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

            </div>
    )}