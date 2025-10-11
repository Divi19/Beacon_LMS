import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import Button from "../../../components/Button/Button";
import s from "./CourseDetailEnrolled.module.css";
import axios from "axios";
import { api } from "../../../api";

export default function CourseDetailEnrolled() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // choose a lesson id: take the first from backend if present; otherwise a temp one
  // To remove after backend integration, frontend testing purposes.
  const getLessonId = (course) =>
    course?.lessons && course.lessons.length > 0
      ? course.lessons[0].lesson_id
      : null;

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/courses/${courseId}/detail/`)
      .then((res) => {
        if (!cancelled) setCourse(res.data);
      })
      .catch(() => {
        if (!cancelled) setCourse(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <>
        <StudentTopBar />
        <div style={{ padding: 24 }}>Loading…</div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <StudentTopBar />
        <div style={{ padding: 24 }}>
          <p>Course not found.</p>
          <Button onClick={() => navigate("/student/my-courses")}>Back</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentTopBar />
      <div className={s.wrap}>
        <div className={s.panel}>
          <h2 className={s.title}>{course.course_title}</h2>

          <div className={s.meta}>
            <span>
              Code: <strong>{course.course_id}</strong>
            </span>
            <span>{course.course_credits} Credits</span>
            <span>
              Course Director: <strong>{course.course_director}</strong>
            </span>
          </div>

          <h3 className={s.subhead}>Course Description:</h3>
          <p className={s.desc}>{course.course_description}</p>

          <h3 className={s.subhead}>Core lessons:</h3>
          <div className={s.chips}>
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson) => (
                <span key={lesson.lesson_id} className={s.chip}>
                  {lesson.title || lesson.lesson_id}
                </span>
              ))
            ) : (
              <span className={s.noLessons}>No lessons</span>
            )}
          </div>

          <div className={s.actions}>
            <Button className={s.enrollBtn} onClick={() => navigate("/student/my-lesson")}>
              Go to my course lessons
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
            <Button className={s.enrollBtn} onClick={() => navigate("/student/my-courses")}>
              Back to My Courses
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
                <polyline points="12 8 8 12 12 16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </Button>

            
            <Button
              className={s.cta} // To remove after integration just to access lesson detail without actual lesson list page.
              type="button"
              onClick={() =>
                navigate(`/student/course/${courseId}/lesson-enroll`
                  // `/student/course/${courseId}/lesson/${getLessonId(course)}`
                )
              }
            >
              Go to my course lessons →
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
