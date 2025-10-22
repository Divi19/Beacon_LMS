import React, { useEffect, useState, useMemo } from "react";
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

  const objectiveItems = useMemo(() => {
    if (!lesson) return [];
    const raw = Array.isArray(lesson.objectives)
      ? lesson.objectives.join("\n")
      : String(lesson.objectives || "");
    return raw
      .split(/\r?\n|•/g)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [lesson]);

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
        await api.get(`instructor/lesson/classrooms/`, {params: {lesson_id: lessonId}}).then(
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

            <div className={s.rect3}>
                <div className={s.label}>
                    <strong>Objective</strong>
                </div>
                    <div className={s.label1}>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {objectiveItems.map((o, idx) => (
                            <li key={idx}>{o}</li>
                          ))}
                        </ul>
                    </div>
                </div>
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
                          {c.time_start}  {c.time_end}
                        </div>

                        <div className={s.clsMetaRow}>
                          <span>{enrolled} students</span>
                          <span>Availability: {availability}</span>
                          <span>ID: {c.classroom_id}</span>
                          <span>Supervisor {c.supervisor}</span>
                        </div>
                        
                        {c.is_online && <div className={s.clsMetaRow}>
                          <span><strong>ONLINE &nbsp;</strong>
                          <a
                            href={c.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'blue', textDecoration: 'underline' }}
                          >
                            {c.zoom_link}
                          </a>
                          </span>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
