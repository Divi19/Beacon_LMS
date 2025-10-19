import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
// import s from "./InstructorLessonProgress.module.css";
import { api } from "../../../api";

export default function LessonProgress() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState("");

  async function fetchProgress() {
    try {
    const { data } = await api.get(
      `/student/courses/${courseId}/lessons/${lessonId}/progress/`
    );
      setProgressPercent(data.progress_percent);
    } catch (err) {
      console.error("Failed to fetch lesson progress:", err);
      setError("Failed to fetch progress");
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchProgress().finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

  return (
    <div>
      <InstructorTopBar />
      <main style={{ padding: 24 }}>
        <h2>Lesson Progress</h2>
        <p>Lesson ID: {lessonId}</p>
        <div style={{ margin: "16px 0" }}>
          <div
            style={{
              width: "100%",
              background: "#eee",
              height: 24,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                background: "#4caf50",
                height: "100%",
                transition: "width 0.3s",
              }}
            ></div>
          </div>
          <p style={{ marginTop: 8, fontWeight: "bold" }}>
            {progressPercent.toFixed(2)}%
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/instructor/course/${courseId}/lesson/${lessonId}`)}
          style={{
            padding: "8px 16px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Back to Lesson Detail
        </button>
      </main>
    </div>
  );
}
