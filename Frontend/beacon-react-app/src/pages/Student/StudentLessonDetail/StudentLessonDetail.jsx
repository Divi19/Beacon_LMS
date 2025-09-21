import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentLessonDetail.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";

export default function StudentLessonDetail() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");

  /**
   * TEMP fetch — replace with real API call when backend is ready:
   *   const { data } = await api.get(`/student/courses/${courseId}/lessons/${lessonId}`);
   *   setLesson(data);
   */
  async function loadLesson() {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            lesson_id: lessonId ?? "TEMP001",
            course_id: courseId ?? "COURSE001",
            title: "Mathematics",
            description: "",
            objectives:
              "Lorem ipsum dolor sit amet.\nconsectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            duration_weeks: 4,
            credit: 4,
            status: "Active",
            // when student is enrolled + classrooms exist, backend will return them
            classrooms: [],
          }),
        250
      )
    );
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Real call (later):
        // const { data } = await api.get(`/student/courses/${courseId}/lessons/${lessonId}`);
        // setLesson(data);

        const data = await loadLesson();
        setLesson(data);
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

  if (loading)
    return (
      <div className={i.wrap}>
        <div className={i.topBar}>
          <StudentTopBar />
        </div>
        <div style={{ padding: 24 }}>Loading…</div>
      </div>
    );

  if (error || !lesson)
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

            <div className={i.courseName}>
              {lesson.title || "Untitled Lesson"}
            </div>
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

      {/* Classrooms section */}
      <div className={i.rect4}>
        <div className={i.label}>
          <strong>My Classrooms</strong>
        </div>

        {lesson.classrooms && lesson.classrooms.length > 0 ? (
          <div className={i.clsList}>
            {/* TODO: render classroom cards when backend returns them */}
          </div>
        ) : (
          <>
            <div className={i.label2}>
              Enroll to lessons first to choose classroom
            </div>

            <div className={i.centerRow}>
              {/* TEMP route: switch to `/student/course/${courseId}/lesson/${lessonId}/enroll` later */}
              <Button
                variant="blue"
                className={i.enrollBtn}
                onClick={() => navigate("/student/lesson-enrollment")}
              >
                <span>Enroll to lesson</span>
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
          </>
        )}
      </div>
    </div>
  );
}
