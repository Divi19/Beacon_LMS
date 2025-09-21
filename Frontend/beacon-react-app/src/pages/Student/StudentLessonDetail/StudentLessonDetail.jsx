import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import i from "./StudentLessonDetail.module.css";
import StudentTopBar from "../../../components/StudentTopBar/StudentTopBar";

export default function StudentLessonDetail() {
  const navigate = useNavigate();

  // useEffect(() => {
  //   let cancelled = false;

  //   async function checkCourses() {
  //     try {
  //       const res = await axios.get("http://localhost:8000/courses/frontend/");
  //       if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
  //         // Instructor has at least one course — go to the list view
  //         navigate("/student/my-lesson", { replace: true });
  //       }
  //       // else: stay on this page and show "No courses yet"
  //     } catch (err) {
  //       // Silently fail and keep user here; you can log if you want
  //       console.error("Failed to check courses", err);
  //     }
  //   }

  //   checkCourses();
  //   return () => { cancelled = true; };
  // }, [navigate]);

  return (
    <div className={i.wrap}>
      <div className={i.topBar}>
        <StudentTopBar />
      </div>
      <header className={i.header}>
        <div className={i.rect}>
          <div className={i.courseInfo}>
            <div className={i.courseHeader}>
              <div className={i.courseCode}>MAT1480</div>
              <div className={i.courseMeta}>4 Credits ~ 4 Weeks</div>
            </div>
            <div className={i.courseName}>Mathematics</div>
            <div className={i.courseDesigner}>Lesson Designer: Ms. Wong</div>
            <div className={i.courseDesigner}>Description: </div>
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
            <div className={i.label}><strong>Objective</ strong></div>
            <div className={i.label1}>
            </div>
        </div>
      </header>
      <div className={i.rect4}>
        <div className={i.label}><strong>My Classrooms</strong></div>
        <div className={i.label2}>
          Enroll to lessons first to choose classroom
        </div>
      </div>

        <div className={i.centerRow}>
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
    </div>
  );
}