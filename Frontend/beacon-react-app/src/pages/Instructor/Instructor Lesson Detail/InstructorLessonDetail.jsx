import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import s from "./InstructorLessonDetail.module.css";
import {api} from "../../../api" 

export default function LessonDetail() {
  const { courseId, lessonId } = useParams();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();
  const [students, setStudents] = useState([])

  // replace with real API call later
  async function loadLesson() {

    const {data} = (await api.get(`instructor/lessons/${lessonId}/detail/`))
    return data
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [lessonData] = await Promise.all([
          loadLesson(),
        ]);
        setLesson(lessonData);
        await api.get(`instructor/${lessonId}/classrooms/`).then(
          res => setClassrooms(res.data)
        )
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
                    {lesson.credits} Credits ~ {lesson.duration_weeks} weeks
                  </span>
                </div>
              </div>

              <h2 className={s.title}>{lesson.title || "Untitled Lesson"}</h2>
              <p className={s.kv}>
                <span className={s.k}>Lesson Designer:</span> {lesson.created_by}
              </p>
              <p className={s.kv}>
                <span className={s.k}>Description:</span>{" "}
                {lesson.description || ""}
              </p>
              <p className={s.kv}>
                <span className={s.k}>Enrolled student:</span>{" "}
                {lesson.enrolled_count || "0"}
              </p>

              <button className={s.cta} 
                      type="button"
                      onClick={() =>
                        navigate(
                          `/instructor/course/${courseId}`
                        )
                      }
              >
                Go to my course lessons →
              </button> {/*Needs navigation*/}
            </article>

            <aside className={`${s.cardBase} ${s.objectiveCard}`}>
              <h3 className={s.objTitle}>Objective</h3>
              <ul className={s.objList}>
                {lesson.objectives}
              </ul>
            </aside>
          </div>

          <section className={`${s.cardBase} ${s.classrooms}`}>
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
                    enrolled,
                    0
                  )}/${capacity}`;
                  const hours = Math.floor((c.duration_minutes ?? 0) / 60) || 0;

                  return (
                    <div key={c.classroom_id} className={s.clsCard}>
                      <div className={s.clsColDay}>
                        <div className={s.clsDay}>{c.day_of_week}</div>
                        <div className={s.clsDur}>{hours} Hours</div>
                      </div>

                      <div className={s.clsColTime}>
                        <div className={s.clsTime}>
                          {c.time_start} – {c.time_end}
                        </div>
                        <div className={s.clsMetaRow}>
                          <span>{enrolled} students</span>
                          <span>Availability: {availability}</span>
                          <span>ID: {c.classroom_id}</span>
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
