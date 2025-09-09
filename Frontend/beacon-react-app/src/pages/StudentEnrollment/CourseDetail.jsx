import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentTopBar from "../../components/StudentTopBar/StudentTopBar";
import Button from "../../components/Button/Button";
import courses from "../../data/courses";
import { useEnrollment } from "../../state/EnrollmentContext";
import s from "./CourseDetail.module.css";
import axios from "axios";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();

  // const course = useMemo(
  //   () => courses.find((c) => c.id === courseId),
  //   [courseId]
  // );
  const [course, setCourse] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/courses/frontend/${courseId}/`)
    .then((res) => setCourse(res.data))
    .catch(() => setCourse(null));
  }, [courseId]);

  if (!course) {
    return (
      <>
        <StudentTopBar />
        <div style={{ padding: 24 }}>
          <p>Course not found.</p>
          <Button onClick={() => navigate("/student/enrollment")}>Back</Button>
        </div>
      </>
    );
  }

  const handleEnroll = () => {
    if (!isEnrolled(course.course_id)) enroll(course.course_id);
    navigate("/student/my-courses");
  };

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
              course.lessons.map((id) => (
                <span key={id} className={s.chip}>
                  {id}
                </span>
              ))
            ) : (
              <span className={s.noLessons}>No lessons</span>
            )}
          </div>

          <div className={s.actions}>
            <Button className={s.enrollBtn} onClick={handleEnroll}>
              Enrol
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
        </div>
      </div>
    </>
  );
}
