import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import i from "./StudentLessonEnroll.module.css";
import StudentTopBar from "../../components/StudentTopBar/StudentTopBar";

export default function StudentLessonEnroll() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function checkCourses() {
      try {
        const res = await axios.get("http://localhost:8000/courses/frontend/");
        if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
          // Instructor has at least one course — go to the list view
          navigate("/student/lesson-enrollment", { replace: true });
        }
        // else: stay on this page and show "No courses yet"
      } catch (err) {
        // Silently fail and keep user here; you can log if you want
        console.error("Failed to check courses", err);
      }
    }

    checkCourses();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
      <div className={i.wrap}>
        <div className={i.topBar}>
          <StudentTopBar />
        </div>
        <header className={i.header}>
          <h1 className={i.title}>MY LESSONS</h1>
          <div className={i.rect}>
              <div className={i.label}><strong>Bachelor of Computer Science</ strong></div>
              <div className={i.label1}>
                  <span>Code:<span> C2100</span></span>
                  <span>30<span> Credits</span></span>
              </div>
          </div>
        </header>
        <header className={i.header}>
          <Button
              variant="blue"
              className={i.enrollBtn}
              onClick={() => navigate("/student/classroom-1")}
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
              <div className={i.label2}><strong>Ongoing</ strong></div>
          </div>
        </header>
  
        <section className={i.cardGrid}>
  {lessons.length === 0 ? (
    <>
      <div className={i.cardBox}>
        <h3>Course 1</h3>
        <p>Code: ---      Credits: ---</p>
        <p>Course Director: ---</p>
        <p>Duration: ---</p>
        <Button
            variant="blue"
            className={i.viewBtn}
            onClick={(e) => {
    e.stopPropagation();
    navigate("/student/classroom-1");
  }}
          >
            View
          </Button>
      </div>
      <div className={i.cardBox}>
        <h3>Course 2</h3>
        <p>Code: ---      Credits: ---</p>
        <p>Course Director: ---</p>
        <p>Duration: ---</p>
        <Button
            variant="blue"
            className={i.viewBtn}
            onClick={(e) => {
    e.stopPropagation();
    navigate("/student/classroom-1");
  }}
          >
            View
          </Button>
      </div>
      <div className={i.cardBox}>
        <h3>Course 3</h3>
        <p>Code: ---      Credits: ---</p>
        <p>Course Director: ---</p>
        <p>Duration: ---</p>
        <Button
            variant="blue"
            className={i.viewBtn}
            onClick={(e) => {
    e.stopPropagation();
    navigate("/student/classroom-1");
  }}
          >
            View
          </Button>
      </div>
      <div className={i.cardBox}>
        <h3>Course 4</h3>
        <p>Code: ---      Credits: ---</p>
        <p>Course Director: ---</p>
        <p>Duration: ---</p>
        <Button
            variant="blue"
            className={i.viewBtn}
            onClick={(e) => {
    e.stopPropagation();
    navigate("/student/classroom-1");
  }}
          >
            View
          </Button>
      </div>
      <div className={i.ctaRow}>
      </div>
    </>
  ) : (
    lessons.map((c) => (
      <div key={c.id} className={i.cardBox} onClick={() => navigate("/student/classroom-1")}>
        <h3>{c.lesson_title}</h3>
        <p>Code: {c.lesson_id} | Credits: {c.lesson_credits}</p>
        <p>Course Director: {c.course_director}</p>
      </div>
    ))
  )}
</section>
      </div>
    );
  }