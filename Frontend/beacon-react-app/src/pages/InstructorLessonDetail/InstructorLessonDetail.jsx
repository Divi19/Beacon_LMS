import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorLessonDetail.module.css";

export default function LessonDetail() {
  const { courseId, lessonId } = useParams();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();

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

  // For backend integration
  // async function loadClassrooms() {
  //   // Later: GET /api/courses/:courseId/lessons/:lessonId/classrooms/
  //   // Return [{ id, day, start_time, end_time, duration_minutes, capacity, enrolled_count }, ...]
  //   return [];
  // }

  // To replace by above for backend integration
  async function loadClassrooms() {
    // TEMP: read from localStorage until backend is ready
    const storageKey = `classrooms:${courseId}:${lessonId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [lessonData, classroomData] = await Promise.all([
          loadLesson(),
          loadClassrooms(),
        ]);
        setLesson(lessonData);
        setClassrooms(classroomData);
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
            <div className={s.clsHeaderRow}>
              <h3 className={s.clsTitle}>Lesson Classrooms</h3>

              <button
                className={s.addBtn}
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

            {!classrooms || classrooms.length === 0 ? (
              <>
                <p className={s.empty}>No classroom created yet</p>
              </>
            ) : (
              <div className={s.clsList}>
                {classrooms.map((c) => {
                  const enrolled = c.enrolled_count ?? 0;
                  const capacity = c.capacity ?? 0;
                  const availability = `${Math.max(
                    capacity - enrolled,
                    0
                  )}/${capacity}`;
                  const hours = Math.floor((c.duration_minutes ?? 0) / 60) || 0;

                  return (
                    <div key={c.id} className={s.clsCard}>
                      <div className={s.clsColDay}>
                        <div className={s.clsDay}>{c.day}</div>
                        <div className={s.clsDur}>{hours} Hours</div>
                      </div>

                      <div className={s.clsColTime}>
                        <div className={s.clsTime}>
                          {c.start_time} – {c.end_time}
                        </div>
                        <div className={s.clsMetaRow}>
                          <span>{enrolled} students</span>
                          <span>Availability: {availability}</span>
                          <span>ID: {c.id}</span>
                        </div>
                      </div>

                      <div className={s.clsColActions}>
                        <button
                          className={s.studentsBtn}
                          type="button"
                          disabled
                        >
                          Students
                        </button>
                        <button className={s.arrowBtn} type="button" disabled>
                          →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={s.clsFooter}>
              <button
                className={s.addBottomBtn}
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
