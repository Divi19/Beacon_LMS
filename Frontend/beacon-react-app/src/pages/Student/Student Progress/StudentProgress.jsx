import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import s from "./StudentProgress.module.css";
import { api } from "../../../api";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";

function ProgressBar({ percent = 0, labelRight }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className={s.progressWrap}>
      <div className={s.progressTrack}>
        <div className={s.progressFill} style={{ width: `${pct}%` }} />
      </div>
      {labelRight && <div className={s.progressText}>{labelRight}</div>}
    </div>
  );
}

export default function StudentProgress() {
  const navigate = useNavigate();
  // const { courseId } = useParams();
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // when backend is ready, replace with the API call below 
useEffect(() => {
    let cancelled = false;

    async function fetchCourseAndLessons() {
      try {
        setLoading(true);
        const { data: enrolledCourses } = await api.get(`/student/my_courses`);
console.log("Fetched enrolled courses:", enrolledCourses);

const courseProgressData = await Promise.all(
  enrolledCourses.map(async (course) => {
    const { data: lessonData } = await api.get(
      `/student/courses/${course.course_id}/lessons/enrolled/`
    );

    const lessonsProgress = await Promise.all(
      lessonData.map(async (lesson) => {
        try {
          const { data: progressData } = await api.get(
            `/student/courses/${course.course_id}/lessons/${lesson.lesson_id}/progress/`
          );
          return progressData.progress_percent || 0;
        } catch {
          return 0;
        }
      })
    );

    const courseProgress =
      lessonsProgress.length > 0
        ? Math.round(
            lessonsProgress.reduce((a, b) => a + b, 0) /
              lessonsProgress.length
          )
        : 0;

    return { ...course, progress_percent: courseProgress };
  })
);

if (!cancelled) setCourses(courseProgressData);
      } catch(err) {
        console.error("Failed to fetch lessons", err);
        setError("Failed to fetch course or lessons.");
      } finally {
        if (! cancelled) setLoading(false);
      }
    }
    
    fetchCourseAndLessons();
    return () => { cancelled = true };
  }, []);

  const handleViewLessons = (course_id) => {
    navigate(`/student/reports/course/${course_id}`);
  };

  const handleCompleteCourse = (course_id) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.course_id === course_id
          ? { ...c, is_completed: true, progress_percent: 100 }
          : c
      )
    );
    // Backend later:
    // await api.post(`/student/reports/course/${course_id}/complete/`);
  };

  return (
    <div className={s.page}>
        <StudentTopBar />
      <h1 className={s.pageTitle}>STUDENT PROGRESS</h1>

      {courses.map((c) => {
        const canComplete =
          Number(c.progress_percent) >= 100 && !c.is_completed;
        return (
          <section className={s.card} key={c.course_id}>
            <div className={s.cardHeader}>
              <div className={s.small}>
                Enrolled Course{c.credits ? ` (${c.credits} credits)` : ""}:
              </div>
              <h2 className={s.courseTitle}>{c.course_title}</h2>
            </div>

            <div className={s.progressBlock}>
              <div className={s.progressLabel}>PROGRESS</div>

              {c.is_completed ? (
                <div className={s.completedPill}>COURSE COMPLETED</div>
              ) : (
                <ProgressBar
                  percent={c.progress_percent}
                  labelRight={
                    <span className={s.pctText}>
                      {c.progress_percent}% of course <br /> credits completed
                    </span>
                  }
                />
              )}
            </div>

            <div className={s.actions}>
              <button
                type="button"
                className={s.primaryGhost}
                onClick={() => handleViewLessons(c.course_id)}
              >
                View Lesson progress
              </button>

              <button
                type="button"
                className={s.success}
                disabled={!canComplete}
                onClick={() => handleCompleteCourse(c.course_id)}
                title={
                  !canComplete
                    ? "You can only complete when progress is 100%"
                    : ""
                }
              >
                Complete Course
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
