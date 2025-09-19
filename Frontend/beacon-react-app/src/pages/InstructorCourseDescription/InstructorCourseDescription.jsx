import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import { useEnrollment } from "../../state/EnrollmentContext";
import s from "./InstructorCourseDescription.module.css";
import axios from "axios";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";

export default function InstructorCourseDescription() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();
  const [showLessons, setShowLessons] = useState(false);

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
        <InstructorTopBar />
        <div style={{ padding: 24 }}>
          <p>Course not found.</p>
          <Button onClick={() => navigate("/student/enrollment")}>Back</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <InstructorTopBar />
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
          <br />
          <br />
          <Button variant="orange"
                      className={s.enrollBtn}
                      onClick={() => navigate("/instructor/course-list")}
                    >
                      <span>Back to Courses</span>
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
    <div className={s.wrap}>
  <div className={s.row1}>
    <div className={s.panel1}>
      <h2 className={s.label}>Enrolled Students</h2>
    </div>

    <div className={s.panel1}
      onClick={() => setShowLessons(!showLessons)} 
     style={{ cursor: "pointer" }}>
  <h2 className={s.label}>Lessons</h2>
    </div>

    <div className={s.panel1}>
      <h2 className={s.label}>Active Classrooms</h2>
    </div>
  </div>
</div>
{showLessons && (
  <div className={s.lessonsCard}>
    <h2 className={s.lessonsLabel}>Lessons</h2>

    <div className={s.container}>
      {course.lessons && course.lessons.length > 0 ? (
        course.lessons.map((lesson, idx) => (
          <div key={idx} className={s.card} style={{ cursor: "pointer" }}>
            <h2 className={s.cardTitle}>{lesson.title}</h2>

            <div className={s.cardDesc1}>
        <div className={s.leftGroup}>
          <span>Code:</span>
          <span className={s.spacing}><strong>{lesson.code}</strong></span>
        </div>
      </div>

      <div className={s.cardDesc2}>
        <span>Course Director:</span>
        <span>{lesson.director}</span>
      </div>

      <div className={s.cardDesc3}>
        <span>Duration:</span>
        <span>{lesson.duration}</span>
      </div>
    </div>
        ))
      ) : (
        <div className={s.card} style={{ cursor: "pointer" }}>
          <h2 className={s.cardTitle}>Lesson 1</h2>
          <div className={s.cardDesc1}>
            <div className={s.leftGroup}>
              <span>Code:</span>
            </div>
          </div>
          <div className={s.cardDesc2}>
            <span>Course Director:</span>
          </div>
          <div className={s.cardDesc3}>
            <span>Duration:</span>
          </div>
          <br />
          <br />
          <Button variant="orange"
                      className={s.enrollBtn}
                      onClick={() => navigate("/instructor/lesson-creation")}
                    >
                      <span>Create</span>
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
      )}
    </div>
  </div>
)}
    </>
  );
}
