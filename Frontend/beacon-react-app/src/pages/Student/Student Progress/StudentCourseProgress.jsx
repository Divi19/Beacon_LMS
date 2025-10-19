import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import s from "./StudentCourseProgress.module.css";
import { api } from "../../../api"; 
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";

function Bar({ percent = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className={s.barTrack}>
      <div className={s.barFill} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function StudentCourseProgress() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState({
    course_id: courseId || "",
    course_title: "",
    credits: 0,
  });
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dummy data just for frontend (replace via API when ready) 
  // API placeholders
  useEffect(() => {
    let cancelled = false;

    async function fetchCourseAndLessons() {
      try {
        setLoading(true);
        const { data: courseData } = await api.get(`/courses/${courseId}/detail/`);
        if (!cancelled) {
          setCourse({
            course_id: courseData.course_id,
            course_title: courseData.course_title,
            credits: courseData.course_credits,
          });
        }
        const { data: lessonData } = await api.get(`/student/courses/${courseId}/lessons/enrolled/`);
        console.log("Fetched lessonData:", lessonData)

        const lessonsProgress = await Promise.all(
          lessonData.map(async (lesson) => {
            try {
              const { data: progressData } = await api.get(
                `/student/courses/${courseId}/lessons/${lesson.lesson_id}/progress/`
              );
              return { ...lesson, progress_percent: progressData.progress_percent };
            } catch {
              return { ...lesson, progress_percent: 0 };
            }
          })
        );
        setLessons(lessonsProgress)
      } catch(err) {
        console.error("Failed to fetch lessons", err);
        setError("Failed to fetch course or lessons.");
      } finally {
        if (! cancelled) setLoading(false);
      }
    }
    
    fetchCourseAndLessons();
    return () => { cancelled = true };
  }, [courseId]);

  // Derive course progress as an average of lesson progress
  const courseProgress = useMemo(() => {
    if (!lessons.length) return 0;
    const total = lessons.reduce((acc, l) => acc + (Number(l.progress_percent) || 0), 0);
    return Math.round(total / lessons.length);
  }, [lessons]);

  return (
    <div className={s.page}>
        <StudentTopBar />
      <h1 className={s.pageTitle}>STUDENT LESSON PROGRESS</h1>

      <section className={s.card}>
        <div className={s.headerLeft}>
          <div className={s.small}>
            Enrolled Course{course.credits ? ` (${course.credits} credits)` : ""}:
          </div>
          <h2 className={s.courseTitle}>{course.course_title}</h2>

          <div className={s.blockLabel}>COURSE PROGRESS</div>
          <div className={s.courseBarRow}>
            <div className={s.bigTrack}>
              <div className={s.bigFill} style={{ width: `${courseProgress}%` }} />
            </div>
            <div className={s.bigPct}>
              {courseProgress}% of course <br /> credits completed
            </div>
          </div>
        </div>

        <div className={s.headerActions}>
          <button className={s.ghost} onClick={() => navigate("/student/reports")}>
            Return back to course
          </button>
          <button className={s.success} disabled={courseProgress < 100}>
            Complete Course
          </button>
        </div>

        <div className={s.sep} />

        <div className={s.blockLabel}>LESSON PROGRESS</div>

        <div className={s.lessonList}>
          {lessons.map((ls) => (
            <div className={s.lessonItem} key={ls.lesson_id}>
              <div className={s.lessonMeta}>
                <div className={s.lessonTitle}>{ls.lesson_title || ls.title}</div>
                <div className={s.metaLine}>
                  <span>Duration: {ls.lesson_duration || ls.duration_weeks} week</span>
                  <span>lesson code: {ls.lesson_id}</span>
                  <span>credits: {ls.lesson_credits || ls.credits}</span>
                </div>
              </div>

              <div className={s.lessonRight}>
                <Bar percent={ls.progress_percent || 0} />
                <div className={s.lessonPct}>{ls.progress_percent || 0}%<br />credits</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
