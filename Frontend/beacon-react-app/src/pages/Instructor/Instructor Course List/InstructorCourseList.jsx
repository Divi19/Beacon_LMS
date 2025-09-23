import s from "./InstructorCourseList.module.css";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { api } from "../../../api"; // use shared axios instance

export default function InstructorCourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // prefer instructor endpoint that respects auth
        const { data } = await api.get("/instructor/courses/");
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching courses", err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className={s.wrap}>
        <InstructorTopBar />
        <div style={{ padding: 24 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <InstructorTopBar />
      <header className={s.header}>
        <div className={s.left}>
          <h1 className={s.title}>COURSE</h1>
        </div>
        <div className={s.right}>
          <Button
            variant="orange"
            className={s.enrollBtn}
            onClick={() => navigate("/instructor/course-create")}
          >
            <span>Create Course</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="#6ac3d1ff"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={s.arrow}
            >
              <circle cx="12" cy="12" r="10" fill="#278d9cff" />
              <line x1="12" y1="6" x2="12" y2="18" stroke="white" strokeWidth="2" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
          </Button>
        </div>
      </header>

      {courses.length === 0 ? (
        <section className={s.empty}>
          <p>No courses yet. Create one.</p>
          <Button variant="orange" onClick={() => navigate("/instructor/course-create")}>
            Create Course
          </Button>
        </section>
      ) : (
        <div className={s.container}>
          {courses.map((course) => {
            // tolerate both old and new API shapes
            const id = course.course_id || course.id;
            const title = course.course_title || course.title;
            const credits = course.course_credits ?? course.credits ?? 30;
            const director = course.course_director || course.owner_instructor?.full_name;
            const rawStatus =
              course.status ?? course.course_status ?? course.is_active ?? course.active;
            const statusText =
              typeof rawStatus === "boolean" ? (rawStatus ? "Active" : "Inactive") :
              rawStatus || "—";

            return (
              <div
                key={id}
                className={s.card}
                onClick={() => navigate(`/instructor/course/${id}`)}
                style={{ cursor: "pointer" }}
              >
                <h2 className={s.cardTitle}>{title}</h2>

                <div className={s.cardDesc1}>
                  <div className={s.leftGroup}>
                    <span>Code:</span>
                    <span className={s.spacing}>
                      <strong>{id}</strong>
                    </span>
                  </div>

                  <span>
                    <strong>{credits}</strong> Credits — {statusText}
                  </span>
                </div>

                <div className={s.cardDesc2}>
                  <span>Course Director:</span>
                  <span>
                    <strong>{director || "—"}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
