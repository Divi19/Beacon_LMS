import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { useEnrollment } from "../../../state/EnrollmentContext";
import s from "./InstructorCourseDescription.module.css";
import axios from "axios";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import {api} from "../../../api" 

export default function InstructorCourseDescription() {
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();
  const [showLessons, setShowLessons] = useState(false);

  const { courseId } = useParams();
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState([{ id: "1", name: "Amina Hassan", email: "amina.hassan13@beaccon.edu" },
  { id: "2", name: "Kenji Sato", email: "kenji21sato@beacon.edu" },]); //mock data
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([])
  const [placeholders, setPlaceholders] = useState([])

// fetch the lessons only when user opens the lessons panel
const handleToggleLessons = async () => {
  const willOpen = !showLessons;
  setShowLessons(willOpen);

  if (willOpen && course?.course_id) {
    try {
      const res = await api.get(`/instructor/courses/${courseId}/lessons/`);
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
  /**
   * GET method to show course details according courseId routing 
   */
  useEffect(() => {
    try {
      api 
        .get(`/courses/${courseId}/detail/`)
        .then((res) => setCourse(res.data))
        .catch(() => setCourse(null));

      //Fetching placeholders
      api.get(`/instructor/courses/${courseId}/lessons/`)
        .then((res) => setPlaceholders(res.data))
        .catch(() => setPlaceholders(null));
      } catch (e) {
      console.log("Error loading data", e)
      }
  
  }, [courseId]);

  /**
   * Placeholder for lesson rerouting 
   * Something here is causing problems
   * @param {*} lessonId 
   */
  const handleGoToLesson = (lessonId) => {
    /**
     * Seeing the lesson details
     */
    navigate(`/instructor/course/${courseId}/lesson/${lessonId}`);
  };

  if (!course) {
    return (
      <>
        <InstructorTopBar />
        <div style={{ padding: 24 }}>
          <p>Course not found.</p>
         
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
            {placeholders && placeholders.length > 0 ? (
              placeholders.map((placeholder, idx) => (
                <span key={placeholder.lesson_id? placeholder.lesson_id: idx} className={s.chip}>
                  {placeholder ? placeholder.title : `Lesson ${idx + 1}`}
                </span>
              ))
            ) : (
              <span className={s.noLessons}>No lessons</span>
            )}
          {/* can delete button if not needed here */}
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
      {/* Possibly some nav error here */}
      {lessons.length > 0 ? (lessons.map((lesson, idx) => (
          <div key={idx} className={s.card} style={{ cursor: "pointer" }} onClick={() => navigate(`/instructor/course/${course.course_id}/lesson/${lesson.lesson_id}`)}>
                <h2 className={s.cardTitle} >{lesson.title}</h2>
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
                  <span>{lesson.duration_weeks}</span>
                </div>
              <Button
                variant="orange"
                className={s.createLessonBtn}
                onClick={ e => {
                  e.stopPropagation();
                  navigate(`/instructor/course/${courseId}/lesson-creation/${lesson.lesson_id || lesson.code || lesson.id}`);
                }
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


