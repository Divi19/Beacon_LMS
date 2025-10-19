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

  // Dummy data just for frontend (replace via API when ready) 
  const [course, setCourse] = useState({
    course_id: courseId || "BCS120",
    course_title: "Bachelor of computer science",
    credits: 120,
  });

  const [lessons, setLessons] = useState([
    {
      lesson_id: "GFX1243",
      title: "Introduction to statistics",
      duration_weeks: 2,
      credits: 4,
      progress_percent: 40,
    },
    {
      lesson_id: "GFX1123",
      title: "Introduction to science",
      duration_weeks: 3,
      credits: 10,
      progress_percent: 90,
    },
    {
      lesson_id: "GFX1248",
      title: "Introduction to data",
      duration_weeks: 2,
      credits: 8,
      progress_percent: 10,
    },
    {
      lesson_id: "GFX1249",
      title: "Introduction to statistics",
      duration_weeks: 2,
      credits: 7,
      progress_percent: 50,
    },
  ]);

  // API placeholders
  useEffect(() => {
    // (async () => {
    //   const { data: courseData } = await api.get(`/student/courses/${courseId}/detail/`);
    //   setCourse({
    //     course_id: courseData.course_id,
    //     course_title: courseData.course_title,
    //     credits: courseData.course_credits,
    //   });
    //   const { data: lessonData } = await api.get(`/student/courses/${courseId}/lessons/enrolled/`);
    //   // lessonData: [{ lesson_id, title, duration_weeks, credits, progress_percent }, ...]
    //   setLessons(lessonData);
    // })();
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
                <div className={s.lessonTitle}>{ls.title}</div>
                <div className={s.metaLine}>
                  <span>Duration: {ls.duration_weeks} week</span>
                  <span>lesson code: {ls.lesson_id}</span>
                  <span>credits: {ls.credits}</span>
                </div>
              </div>

              <div className={s.lessonRight}>
                <Bar percent={ls.progress_percent} />
                <div className={s.lessonPct}>{ls.progress_percent}%<br />credits</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
