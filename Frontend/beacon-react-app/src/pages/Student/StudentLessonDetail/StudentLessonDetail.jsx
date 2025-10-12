import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentLessonDetail.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { api } from "../../../api";
export default function StudentLessonDetail() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const reload = () => setRefreshKey(k => k + 1);

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");

  // enrollment & classroom state
  const [isLessonEnrolled, setIsLessonEnrolled] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [chosenClassroom, setChosenClassroom] = useState(null);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  async function apiGetLesson() {
    //GET
    const res = await api.get(`/student/courses/lesson/detail/${lessonId}/`);
    return res.data; // return parsed json
  }
  
  async function apiGetClassrooms() {
    //GET
    const res = await api.get(`/student/lessons/${lessonId}/classrooms/unenrolled/`);
    return res.data;
  }
  
  async function apiEnrollClassroom(classroom_id) {
    //POST
    const res = await api.post(`/student/lessons/${lessonId}/classrooms/enroll/${classroom_id}/`);
    return res.data;
  }
  
  async function apiLeaveClassroom(classroom_id) {
    // DELETE
    const res = await api.delete(`/student/lessons/${lessonId}/classrooms/enrolled/${classroom_id}/`);
    return res.data;
  }
  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const lessonData = await apiGetLesson();
  
        setLesson(lessonData);
        setIsLessonEnrolled(lessonData.is_enrolled);
        setChosenClassroom(lessonData.chosen_classroom || null);
  
        // If enrolled but NO chosen classroom yet → fetch options
        if (lessonData.is_enrolled && !lessonData.chosen_classroom) {
          const cls = await apiGetClassrooms();
          setClassrooms(cls);
        } else {
          setClassrooms([]);
        }
      } catch (e) {
        setError("Failed to load lesson.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, lessonId, refreshKey]);

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

  function fmtHours(mins = 0) {
    const h = Math.floor(mins / 60);
    return h <= 1 ? `${h || 1} Hour` : `${h} Hours`;
  }
  async function apiEnrollLesson() {
    const res = await api.post(`/student/courses/${courseId}/lessons/enroll/${lessonId}/`);
    return res.data;
  }

  async function handleEnrollLesson() {
    try {
      await apiEnrollLesson();
      setIsLessonEnrolled(true);
      // fetch classrooms after enrollment
      const cls = await apiGetClassrooms();
      setClassrooms(cls);
      reload();
    } catch {
      
    }
  }

  async function handleEnrollClassroom(c) {
    if (!c) return;
    try {
      await apiEnrollClassroom(c.classroom_id);
      setChosenClassroom(c);
      setClassrooms([]);

      setModalText(
        `Enrolled to classroom:\n${c.day_of_week} ${c.time_start} - ${c.time_end}`
      );
      setShowModal(true);
      reload();
    } catch (err) {
      console.error("Enroll classroom failed", err?.response || err);
      setModalText(
        err?.response?.data?.detail || "Could not enroll to this classroom."
      );
      setShowModal(true);
    }
  }

  async function handleLeaveClassroom() {
    if (!chosenClassroom) return;
    try {
      await apiLeaveClassroom(chosenClassroom.classroom_id);
      setChosenClassroom(null);
      // re-list all classrooms
      const cls = await apiGetClassrooms();
      setClassrooms(cls);
      reload();
    } catch {
      
    }
  }


  if (loading) {
    return (
      <div className={i.wrap}>
        <div className={i.topBar}>
          <StudentTopBar />
        </div>
        <div style={{ padding: 24 }}>Loading…</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className={i.wrap}>
        <div className={i.topBar}>
          <StudentTopBar />
        </div>
        <div style={{ padding: 24, color: "#b00020" }}>
          {error || "Lesson not found."}
        </div>
      </div>
    );
  }

  const showPickClassList = isLessonEnrolled && !chosenClassroom;
  const showChosenClass = isLessonEnrolled && !!chosenClassroom;

  return (
    <div className={i.wrap}>
      <div className={i.topBar}>
        <StudentTopBar />
      </div>

      <header className={i.header}>
        <div className={i.rect}>
          <div className={i.courseInfo}>
            <div className={i.courseHeader}>
              <div className={i.courseCode}>{lesson.lesson_id}</div>
              <div className={i.courseMeta}>
                {lesson.credits} Credits ~ {lesson.duration_week} Weeks
              </div>
            </div>

            <div className={i.courseName}>{lesson.title || "Untitled Lesson"}</div>
            <div className={i.courseDesigner}>
              Lesson Designer: {lesson.designer || "Unknown"}
              </div>
            <div className={i.courseDesigner}>
              Description: {lesson.description || ""}
            </div>
          </div>

          <Button
            variant="blue"
            className={i.rectBtn}
            onClick={() => navigate("/student/lesson-enrollment")}
          >
            <span>Go to my course lessons</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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

        <div className={i.rect3}>
          <div className={i.label}>
            <strong>Objective</strong>
          </div>
          <div className={i.label1}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {objectiveItems.map((o, idx) => (
                <li key={idx}>{o}</li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* --- Classrooms section --- */}
      <div className={i.rect4}>
        <div className={i.label}>
          <strong>My Classrooms</strong>
        </div>

        {!isLessonEnrolled && (
          <>
            <div className={i.label2}>Enroll to lessons first to choose classroom</div>
            <div className={i.centerRow}>
              <Button variant="blue" className={i.enrollBtn} onClick={handleEnrollLesson}>
                <span>Enroll to lesson</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
          </>
        )}

        {showPickClassList && (
          <>
            <div className={i.noChosenText}>No Chosen Classroom yet</div>
            <div className={i.clsList}>
              {classrooms.map((c) => {
                const occupied = Math.max(c.enrolled_count ?? 0, 0);
                const capacity = Number.isFinite(c.capacity) ? c.capacity : 0;
                const isActive = c.is_active !== false;
                const full = occupied >= capacity || !isActive;

                return (
                  <div className={i.clsCard} key={c.classroom_id}>
                    <div className={i.clsColDay}>
                      <div className={i.clsDay}>{c.day_of_week}</div>
                      <div className={i.clsDur}>{fmtHours(c.duration_minutes)}</div>
                    </div>

                    <div className={i.clsColTime}>
                      <div className={i.clsTime}>
                        {c.time_start} - {c.time_end}
                      </div>
                      <div className={i.clsMetaRow}>
                        <span>10 students</span>
                        <span>
                          Availability: {occupied}/{c.capacity}
                        </span>
                        <span>ID: {c.classroom_id}</span>
                      </div>
                    </div>

                    <div className={i.clsColActions}>
                      <Button
                        variant="blue"
                        className={i.enrolClassBtn}
                        disabled={full}
                        onClick={() => handleEnrollClassroom(c)}
                      >
                        <span>Enrol to class</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
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
                  </div>
                );
              })}
            </div>
          </>
        )}

        {showChosenClass && (
          <div className={i.clsList}>
            <div className={i.clsCard}>
              <div className={i.clsColDay}>
                <div className={i.clsDay}>{chosenClassroom.day_of_week}</div>
                <div className={i.clsDur}>{fmtHours(chosenClassroom.duration_minutes)}</div>
              </div>

              <div className={i.clsColTime}>
                <div className={i.clsTime}>
                  {chosenClassroom.time_start} - {chosenClassroom.time_end}
                </div>
                <div className={i.clsMetaRow}>
                  <span>10 students</span>
                  <span>
                    Availability:{" "}
                    {Math.max(
                      (chosenClassroom.enrolled_count ?? 0), 
                      0
                    )}
                    /{chosenClassroom.capacity}
                  </span>
                  <span>ID: {chosenClassroom.classroom_id}</span>
                </div>
              </div>

              <div className={i.clsColActions}>
                <Button
                  variant="orange"
                  className={i.leaveBtn}
                  onClick={handleLeaveClassroom}
                >
                  Leave Class
                </Button>
              </div>
            </div>


            <div className={i.readingAndProgress}>
              <section className={i.panelBox}>
                <h3 className={i.panelTitle}>Reading List</h3>
              </section>
              <section className={i.panelBoxSmall}>
                <h3 className={i.panelTitle}>Course Progress</h3>
              </section>
            </div>

            <section className={i.panelBox}>
              <h3 className={i.panelTitle}>Assignment List</h3>
            </section>
          </div>
        )}
      </div>


      {showModal && (
        <div className={i.modalOverlay} role="dialog" aria-modal="true">
          <div className={i.modalCard}>
            <h3 className={i.modalTitle}>Successfully</h3>
            <p className={i.modalBody}>{modalText}</p>
            <Button variant="blue" className={i.modalCta} onClick={() => setShowModal(false)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
