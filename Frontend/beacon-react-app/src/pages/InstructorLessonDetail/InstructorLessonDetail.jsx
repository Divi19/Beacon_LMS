import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorLessonDetail.module.css";

export default function LessonDetail() {
  const { courseId, lessonId } = useParams();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");

  // replace with real API call later
  async function loadLesson() {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            lesson_id: lessonId,
            course_id: courseId,
            title: "Mathematics",
            description:
              "This courses will teach you about the importance of statistics",
            objectives: [
              "Lorem ipsum dolor sit amet.",
              "consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            ],
            duration_weeks: 4,
            credit: 4,
            status: "draft",
          }),
        250
      )
    );
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await loadLesson();
        setLesson(data);
      } catch (e) {
        setError("Failed to load lesson.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, lessonId]);

  if (loading)
    return (
      <div className={s.wrap}>
        <p>Loading…</p>
      </div>
    );
  if (error)
    return (
      <div className={s.wrap}>
        <p className={s.err}>{error}</p>
      </div>
    );
  if (!lesson) return null;

  return (
    <div>
      <InstructorTopBar />
      <main className={s.wrap}>
        <section className={s.page}>
          <div className={s.grid}>
            <article className={`${s.cardBase} ${s.summaryCard}`}>
              <div className={s.summaryTop}>
                <h4 className={s.code}>
                  {lesson.lesson_id?.toString().toUpperCase()}
                </h4>
                <div className={s.metaRight}>
                  <span className={s.metaValue}>
                    {lesson.credit} Credits ~ {lesson.duration_weeks} weeks
                  </span>
                </div>
              </div>

              <h2 className={s.title}>{lesson.title || "Untitled Lesson"}</h2>
              <p className={s.kv}>
                <span className={s.k}>Lesson Designer:</span> Ms. Wong
              </p>
              <p className={s.kv}>
                <span className={s.k}>Description:</span>{" "}
                {lesson.description || ""}
              </p>

              <button className={s.cta} type="button">
                Go to my course lessons →
              </button>
            </article>

            <aside className={`${s.cardBase} ${s.objectiveCard}`}>
              <h3 className={s.objTitle}>Objective</h3>
              <ul className={s.objList}>
                {lesson.objectives.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </aside>
          </div>

          <section className={`${s.cardBase} ${s.classrooms}`}>
            <h3 className={s.clsTitle}>My Classrooms</h3>
            <div className={s.clsBody}>
              <p className={s.empty}>No classroom created yet</p>
              <button
                className={s.ghostCta}
                type="button"
                onClick={() =>
                  navigate(
                    `/instructor/course/${courseId}/lesson/${lessonId}/classroom/new`
                  )
                }
              >
                Add Classroom →
              </button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
