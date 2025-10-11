import React, {useEffect, useState} from 'react';

import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios'
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";
import { useEnrollment } from "../../../state/EnrollmentContext";
import allCourses from "../../../data/courses";
import CourseCard from "../../../components/CourseCard/CourseCard";
import s from "./StudentLessonEnroll.module.css";
import { api } from "../../../api";
import LessonCard from "../../../components/LessonCard/LessonCard";

export default function StudentMyLessonsPage() {
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([
        {
            id: 1,
            title: "Introduction to Physics",
            code: "PHY1321",
            credit: 2,
            director: "Dr. Charles Xavier",
            duration: 2,
        },
        {
            id: 2,
            title: "Advanced Programming",
            code: "CSC2202",
            credit: 3,
            director: "Prof. Jean Grey",
            duration: 4,
        },
    ]);
    const [ready, setReady] = useState(false);
    const [course, setCourse] = useState({
        title: "Bachelor of Computer Science",
        code: "C2100",
        credit: 30,
        status: "Ongoing",
    });

    useEffect(() => {
        let cancelled = false;

        async function checkLessons() {
            try {
                const res = await api.get("/lessons/frontend/");
                if (
                    !cancelled &&
                    Array.isArray(res.data) &&
                    res.data.length > 0
                ) {
                    // Instructor has at least one course — go to the list view
                    navigate("/student/enrollment", { replace: true });
                }
                // else: stay on this page and show "No courses yet"
            } catch (err) {
                // Silently fail and keep user here; you can log if you want
                console.error("Failed to check lessons", err);
            }
        }

        checkLessons();
        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return (
        <div className={i.wrap}>
            <div className={i.topBar}>
                <StudentTopBar />
            </div>
            <header className={i.header}>
                <h1 className={i.title}>MY LESSONS</h1>
                <div className={i.rect}>
                    <div className={i.label}>
                        <strong>{course.title}</strong>
                    </div>
                    <div className={i.label1}>
                        <span>
                            Code:<span> {course.code}</span>
                        </span>
                        <span>
                            {course.credit}
                            <span> Credits</span>
                        </span>
                    </div>
                </div>
            </header>
            <header className={i.header}>
                <Button
                    variant="blue"
                    className={i.enrollBtn}
                    onClick={() => navigate("/student/lesson-enrollment")}
                >
                    <span>Enrollment</span>
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
                <div className={i.rect1}>
                    <div className={i.label2}>
                        <strong>{course.status}</strong>
                    </div>
                </div>
            </header>

            {lessons.length === 0 ? (
                <div className={i.noLessons}>No lessons yet.</div>
            ) : (
                <div className={i.grid1}>
                    {lessons.map(lesson => (
                        <LessonCard
                            key={lesson.id}
                            lesson={{
                                code: lesson.code,
                                title: lesson.title,
                                credit: lesson.credit,
                                director: lesson.director,
                                duration: lesson.duration,
                            }}
                            isEnrolled={true}
                            ctaText="View"
                            onClick={() =>
                                navigate(`/student/lesson/${lesson.id}`)
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
export default function StudentLessonEnroll() {
  // const { isEnrolled } = useEnrollment();
  const navigate = useNavigate();
  //Dummy value
  const student_id = localStorage.getItem("studentId")
  //const available = allCourses.filter((c) => !isEnrolled(c.id));
  const [lessons, setLessons] = useState([])
  const [submittingId, setSubmittingId] = useState(null);
  const { courseId } = useParams();
  const [allLessons, setAllLessons] = useState([]);

  const fetchLessons = async () => {
    
    try {
      const res = await api.get(`/student/courses/${courseId}/lessons/unenrolled`);
      console.log("Unenrolled lessons data:", res.data);
          setLessons(res.data);
    } catch (err) {
      console.error("Error fetching unenrolled lessons", err);
      alert("Failed to load available lessons.");
    } 
  };

  const handleEnroll = async (lessonCode) => {
    console.log("Enroll clicked for lesson:", lessonCode);
    try {
      setSubmittingId(lessonCode);
      await api.post( `/student/courses/enroll/`, {
        course_id: courseId,
        lesson_id: lessonCode,
      });

      navigate("/student/my-lesson");
      await fetchLessons(); // refresh after write so UI stays correct (the number of unenrolled)
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "Student already enrolled") {
        await fetchLessons();
      } else {
        console.error("Enrollment failed", err);
        alert(detail || "Failed to enroll in course.");
      }
    } finally {
      setSubmittingId(null);
    }
  };

const fetchAllLessons = async () => {
  try {
    const res = await api.get(`/courses/${courseId}/detail/`); // endpoint returning all lessons
    setAllLessons(res.data.lessons || []); // assuming response has a 'lessons' array
  } catch (err) {
    console.error("Error fetching all lessons", err);
  }
};


  useEffect(() => {
    fetchLessons();
    fetchAllLessons();
  }, []);

  const enrolledLessons = allLessons.filter(
  lesson => !lessons.some(un => un.lesson_id === lesson.lesson_id)
);

console.log("Enrolled lessons (temporary):", enrolledLessons);
// export default function StudentEnrollment() {
//   //const { isEnrolled } = useEnrollment();
//   const navigate = useNavigate();
//   //Dummy value
//   const student_id = 1 
//   //const available = allCourses.filter((c) => !isEnrolled(c.id));
//   const [unenrolled, setUnenrolled] = useState([])
//   const [submittingId, setSubmittingId] = useState(null);

//   const fetchCourses = async () => {
//     try {
//       await axios.get(`http://localhost:8000/courses/frontend/${student_id}/student/enrollment/`).then(
//         res => {
//           setUnenrolled(res.data);
//         }
//       )
//     } catch (err) {
//       console.error("Error fetching unenrolled courses", err);
//       alert("Failed to load available courses.");
//     } 
//   };

  // const handleEnroll = async (courseId) => {
  //   try {
  //     setSubmittingId(courseId);
  //     await axios.post( `http://localhost:8000/courses/frontend/${student_id}/student/enroll/`, {
  //       course_id: courseId,
  //     });
  //     await fetchCourses(); // refresh after write so UI stays correct
  //   } catch (err) {
  //     const detail = err?.response?.data?.detail;
  //     if (detail === "Student already enrolled") {
  //       await fetchCourses();
  //     } else {
  //       console.error("Enrollment failed", err);
  //       alert(detail || "Failed to enroll in course.");
  //     }
  //   } finally {
  //     setSubmittingId(null);
  //   }
  // };

  // useEffect(() => {
  //   fetchCourses();
  // }, []);


  return (
    <>
      <StudentTopBar />
      <div className={s.wrap}>
        <header className={s.header}>
          <h1 className={s.title}>Lesson Enrolment</h1>
        </header>
      <section className={s.grid}>
  {lessons.length > 0 ? (
    lessons.map((lesson) => (
      <CourseCard
        key={lesson.lesson_id}
        course={{
          code: lesson.lesson_id,
          title: lesson.title,
          credits: lesson.credits,
          director: lesson.designer || "Unknown",
          // duration: lesson.duration,
          // designer: lesson.designer,
          description: lesson.description,
        }}
        // onClick={() => navigate(`/student/courses/${courseId}/lessons/${lesson.lesson_id}`)}
        onCta={() => handleEnroll(lesson.lesson_id)}
        ctaText={submittingId === lesson.lesson_id ? "Enrolling…" : "Enroll"}
        />
      // <div key={lesson.lesson_id} className={s.lessonCard}>
      //   <h2>{lesson.title}</h2>
      //   <p>{lesson.description}</p>
      //   <p><strong>Objectives:</strong>{lesson.objectives}</p>
      //   <p><strong>Credits:</strong>{lesson.credits}</p>
      //   <button
      //     onClick={() => handleEnroll(lesson.lesson_id)}
      //     disabled={submittingId === lesson.lesson_id}
      //   >
      //     {submittingId === lesson.lesson_id ? "Enrolling…" : "Enroll"}
      //   </button>
      // </div>
    ))
  ) : (
    <div className={s.empty}>No available lessons to enroll in</div>
  )}
</section>

      </div>
    </>
  );
}
