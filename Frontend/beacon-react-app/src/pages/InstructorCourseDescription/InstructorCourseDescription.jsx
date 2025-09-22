import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  // const LESSON_SLOTS = 5;
  const [lessons, setLessons] = useState([]);
  const location = useLocation();

  useEffect(() => {
  // fetch course on mount / when courseId changes
  axios.get(`http://localhost:8000/courses/frontend/${courseId}/`)
    .then(res => {
      console.log("Course API response:", res.data);
      setCourse(res.data);
    })
    .catch(err => {
      console.error("Error fetching course:", err);
      setCourse(null);
    });
}, [courseId]);

const fetchLessons = async (coursePk) => {
  try {
    // coursePk should be the course.course_id (string primary key)
    const res = await axios.get(`http://localhost:8000/courses/${coursePk}/lessons/`);
    console.log("Lessons API response:", res.data);
    // const padded = [...res.data];
    // while (padded.length < LESSON_SLOTS) padded.push(null);
    setLessons(res.data);
  } catch (err) {
    console.error("Error fetching lessons:", err);
    setLessons([]);
  }
};

// call fetchLessons only when user opens the lessons panel
const handleToggleLessons = async () => {
  const willOpen = !showLessons;
  setShowLessons(willOpen);

  if (willOpen && course?.course_id) {
    try {
      const res = await axios.get(`http://localhost:8000/courses/${course.course_id}/lessons/`);
      console.log("Lessons API response", res.data);

      // const padded = [...res.data];
      // while (padded.length < LESSON_SLOTS) padded.push(null);
      setLessons(res.data);
    } catch (err) {
      console.error("Error fetching lessons", err);
      setLessons([]);
    }
  }
};

useEffect(() => {
  if (location.state?.createdLesson !== undefined && location.state?.slot_index !== undefined) {
    setLessons((prevLessons) => {
      const newLessons = [...prevLessons];
      // while(newLessons.length < LESSON_SLOTS) {
      //   newLessons.push(null);
      // }

      newLessons[location.state.slot_index] = location.state.createdLesson;
      
      return newLessons;
    });
  }
}, [location.state]);

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
            {lessons && lessons.length > 0 ? (
              lessons.map((lesson, idx) => (
                <span key={idx} className={s.chip}>
                  {lesson ? lesson.lesson_title : `Lesson ${idx + 1}`}
                </span>
              ))
            ) : (
              <span className={s.noLessons}>No lessons</span>
            )}
          {/* can delete button if not needed here */}
          </div>
          <div className={s.lessonActions}>
            <Button
            className={s.addLessonBtn}
            // style={{ backgroundColor: "orange", padding: "8px", marginTop: "12px" }}
              // className={s.addLessonBtn}
              onClick={() =>
                navigate(`/instructor/course/${course.course_id}/lesson-create`)
              }
            >
              + Add Lesson
            </Button>
            <Button
              className={s.viewLessonsBtn}
                onClick={() =>
                  navigate(`/instructor/course/${course.course_id}/lesson-list`)
                }
              >
                View Lessons
              </Button>
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
      onClick={handleToggleLessons} 
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
      {lessons.length > 0 ? (lessons.map((lesson, idx) => (
          <div key={idx} className={s.card} style={{ cursor: "pointer" }}>
                <h2 className={s.cardTitle} >{lesson.lesson_title}</h2>
                <div className={s.cardDesc1}>
                  <div className={s.leftGroup}>
                    <span>Code:</span>
                    <span className={s.spacing}><strong>{lesson.lesson_id}</strong></span>
                  </div>
                </div>
                <div className={s.cardDesc2}>
                  <span>Course Director:</span>
                  <span>{course.course_director}</span>
                </div>
                <div className={s.cardDesc3}>
                  <span>Duration:</span>
                  <span>{lesson.lesson_duration}</span>
                </div>
              <Button
                variant="orange"
                className={s.createLessonBtn}
                onClick={() =>
                  navigate(`/instructor/course/${course.course_id}/lesson-creation`,
                  {state : {
                    slot_index: idx,
                    lesson_id: lessons[idx]?.lesson_id || "",
                    lesson_title: lessons[idx]?.lesson_title || "",
                    lesson_credits: lessons[idx]?.lesson_credits || "",
                    lesson_duration: lessons[idx]?.lesson_duration || "",
                    lesson_description: lessons[idx]?.lesson_description || "",
                    lesson_objective: lessons[idx]?.lesson_objective || "",
                    lesson_credits: lessons[idx]?.lesson_prerequisite || "",
                  } }
                  )
                }
                >
                  Create
                </Button>
              </div>
            )) 
          ) : (
              <span className={s.noLessons}>No Lessons</span>
          )}
    </div>
  </div>
)}
</>
  );
}
