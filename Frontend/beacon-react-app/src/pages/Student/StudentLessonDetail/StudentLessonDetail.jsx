import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Button from "../../../components/Button/Button";
import i from "./StudentLessonDetail.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";

export default function StudentLessonDetail() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

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

  /* 
     TEMP “API” – replace these with real endpoints when ready
 */
  async function apiGetLesson() {
    // GET /student/courses/:courseId/lessons/:lessonId
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            lesson_id: lessonId ?? "TEMP_LESSON",
            course_id: courseId ?? "TEMP_COURSE",
            title: "Mathematics",
            description: "",
            objectives:
              "Lorem ipsum dolor sit amet.\nconsectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            duration_weeks: 4,
            credit: 4,
            status: "Active",
          }),
        200
      )
    );
  }

  async function apiGetLessonEnrollment() {
    // GET /student/lessons/:lessonId/enrollment (or included in lesson detail)
    // Return whether the current student is enrolled and selected class if exists
    // For now, simulate “not enrolled”
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            is_enrolled: false,
            chosen_classroom: null,
          }),
        150
      )
    );
  }

  async function apiEnrollLesson() {
    // POST /student/lessons/:lessonId/enroll
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 250));
  }

  async function apiGetClassrooms() {
    // GET /student/lessons/:lessonId/classrooms
    // Use backend fields so it plugs in cleanly later, to be removed after backedn integration
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            {
              classroom_id: "347821",
              day_of_week: "Monday",
              time_start: "08:00",
              time_end: "10:00",
              duration_minutes: 120,
              capacity: 10,
              enrolled_count: 8,
              is_active: true,
            },
            {
              classroom_id: "38752",
              day_of_week: "Monday",
              time_start: "12:00",
              time_end: "14:00",
              duration_minutes: 120,
              capacity: 10,
              enrolled_count: 4,
              is_active: true,
            },
            {
              classroom_id: "35781",
              day_of_week: "Tuesday",
              time_start: "12:00",
              time_end: "14:00",
              duration_minutes: 120,
              capacity: 10,
              enrolled_count: 8,
              is_active: true,
            },
            {
              classroom_id: "34578",
              day_of_week: "Wednesday",
              time_start: "08:00",
              time_end: "10:00",
              duration_minutes: 120,
              capacity: 10,
              enrolled_count: 10, // full
              is_active: true,
            },
            {
              classroom_id: "39485",
              day_of_week: "Thursday",
              time_start: "16:00",
              time_end: "17:00",
              duration_minutes: 60,
              capacity: 10,
              enrolled_count: 0,
              is_active: true,
            },
            {
              classroom_id: "314759",
              day_of_week: "Friday",
              time_start: "18:00",
              time_end: "20:00",
              duration_minutes: 120,
              capacity: 10,
              enrolled_count: 3,
              is_active: true,
            },
          ]),
        220
      )
    );
  }

  async function apiEnrollClassroom(classroom_id) {
    // POST /student/classrooms/:classroom_id/enroll
    return new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true }), 250)
    );
  }

  async function apiLeaveClassroom(classroom_id) {
    // DELETE /student/classrooms/:classroom_id/enroll
    return new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true }), 250)
    );
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [lessonData, enrollData] = await Promise.all([
          apiGetLesson(),
          apiGetLessonEnrollment(),
        ]);
        setLesson(lessonData);
        setIsLessonEnrolled(!!enrollData?.is_enrolled);
        setChosenClassroom(enrollData?.chosen_classroom || null);

        if (enrollData?.is_enrolled && !enrollData?.chosen_classroom) {
          // enrolled to lesson but hasn't picked a class yet:
          const cls = await apiGetClassrooms();
          setClassrooms(cls);
        } else if (enrollData?.chosen_classroom) {
          // enrolled + chosen classroom
          setClassrooms([]);
        }
      } catch (e) {
        setError("Failed to load lesson.");
      } finally {
        setLoading(false);
      }
    })();

  }, [courseId, lessonId]);


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



  async function handleEnrollLesson() {
    try {
      await apiEnrollLesson();
      setIsLessonEnrolled(true);
      // fetch classrooms after enrollment
      const cls = await apiGetClassrooms();
      setClassrooms(cls);
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
    } catch {
      
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
                {lesson.credit} Credits ~ {lesson.duration_weeks} Weeks
              </div>
            </div>

            <div className={i.courseName}>{lesson.title || "Untitled Lesson"}</div>
            <div className={i.courseDesigner}>Lesson Designer: Ms. Wong</div>
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
                const available = Math.max((c.capacity ?? 0) - (c.enrolled_count ?? 0), 0);
                const full = available <= 0 || !c.is_active;

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
                          Availability: {available}/{c.capacity}
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
                      (chosenClassroom.capacity ?? 0) -
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
