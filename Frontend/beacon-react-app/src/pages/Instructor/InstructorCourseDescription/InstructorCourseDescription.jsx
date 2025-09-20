import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { useEnrollment } from "../../../state/EnrollmentContext";
import s from "./InstructorCourseDescription.module.css";
import axios from "axios";
import InstructorTopBar from "../../../components/InstructorTopBar/InstructorTopBar";
import {api} from "../../../api" 

export default function InstructorCourseDescription() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { enroll, isEnrolled } = useEnrollment();

  // const course = useMemo(
  //   () => courses.find((c) => c.id === courseId),
  //   [courseId]
  // );
  const [course, setCourse] = useState(null);

  useEffect(() => {
    api.get(`instructor/courses/${courseId}/detail/`)
    .then((res) => setCourse(res.data))
    .catch(() => setCourse(null));
  }, [courseId]);

  const handleGoToLesson = (lessonId = "draft-1") => {
    navigate(`/instructor/course/${courseId}/lesson/${lessonId}`);
  };

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
              Code: <strong>{course.course_code}</strong>
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
        </div>

  
        <button  // Button to go to lesson detail from course detail placeholder for testing purposes
          className="goLessonsCta" 
          onClick={() => handleGoToLesson()}
          type="button"
        >
          Go to my course lessons detail
        </button>
      </div>
    </>
  );
}
