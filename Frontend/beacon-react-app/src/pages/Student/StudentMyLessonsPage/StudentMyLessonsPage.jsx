import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentMyLessonsPage.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api";
import LessonCard from "../../../components/LessonCard/LessonCard";

export default function StudentMyLessonsPage() {
  const navigate = useNavigate();
  const { courseId } =useParams();
  const location = useLocation();
  // const course = location.state?.course || null
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(location.state?.course || null);
  const [loadingCourse, setLoadingCourse] = useState(!location.state?.course);

  useEffect(() => {
    if (!course) {
      setLoadingCourse(true);
      api.get(`/courses/${courseId}/detail`)
      .then(res => setCourse(res.data))
      .catch(err => console.error("Failed to fetch course", err))
      .finally(() => setLoadingCourse(false));
    }
  }, [course, courseId]);

  useEffect(() => {
    let cancelled = false;

    async function checkLessons() {
      try {
        setLoading(true);
        const res = await api.get(`/student/courses/${courseId}/lessons/enrolled/`);
        if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
          // Instructor has at least one course — go to the list view
          setLessons(res.data || []);
        }
        // else: stay on this page and show "No courses yet"
      } catch (err) {
        // Silently fail and keep user here; you can log if you want
        console.error("Failed to check courses", err);
      }
    }

    checkLessons();
    return () => { cancelled = true; };
  }, [courseId]);

  // const handleLessonClick = (lesson_id) => {
  //   navigate(`/student/courses/${courseId}/lessons/{lesson_id}`);
  // }

  return (
    <div className={i.wrap}>
      <div className={i.topBar}>
        <StudentTopBar />
      </div>
      <header className={i.header}>
        <h1 className={i.title}>MY LESSONS</h1>
        <div className={i.rect}>
            <div className={i.label}><strong>{course?.course_title || "Loading..."}</strong></div>
            <div className={i.label1}>
                <span>Code:<span> {course?.course_id || "-"}</span></span>
                <span> {course?.course_credits || "-"}<span> Credits</span></span>
            </div>
        </div>
      </header>
      <header className={i.header}>
        <Button
            variant="blue"
            className={i.enrollBtn}
            onClick={() => navigate(`/student/course/${courseId}/lesson-enroll`, {state:{course}})}
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
            <div className={i.label2}><strong>Ongoing</ strong></div>
        </div>
      </header>

      {lessons.length === 0 ? (
  <section className={i.card}>
    <p className={i.emptyText}>
      No enrolled lessons in this course yet.<br />
    </p>
    <div className={i.ctaRow}>
      <Button
        variant="blue"
        className={i.enrollBtn}
        onClick={() => navigate(`/student/course/${courseId}/lesson-enroll`, {state:{course}})}
      >
        <span>First time enrollment</span>
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
    </div>
  </section>
) : (
  <div className={i.grid1}>
    {lessons.map((lesson) => (
      <LessonCard
        key={lesson.lesson_id}
        lesson={{
          code: lesson.lesson_id,
          title: lesson.lesson_title,
          credit: lesson.lesson_credits,
          // director: lesson.director,
          duration: lesson.lesson_duration,
        }}
        isEnrolled={true}
        ctaText="View"
        onClick={() => navigate(`/student/course/${courseId}/lesson/${lesson.lesson_id}`)}
      />
    ))}
  </div>
)}
    </div>
  );
}