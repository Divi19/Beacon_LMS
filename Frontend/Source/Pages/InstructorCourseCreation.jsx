import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import i from "./InstructorCourseCreation.module.css";
import InstructorTopBar from "../../components/InstructorTopBar/InstructorTopBar";

export default function InstructorCourseCreation() {
  const navigate = useNavigate();

  return (
    <div className={i.wrap}>
      <div className={i.topBar}>
    <InstructorTopBar />
  </div>
      <header className={i.header}>
        <h1 className={i.title}>COURSES</h1>
      </header>

      <section className={i.card}>
        <p className={i.emptyText}>
          No courses yet. Create one<br />
        </p>

        <div className={i.ctaRow}>
          <Button
            variant="orange"
            className={i.enrollBtn}
            onClick={() => navigate("/instructor/course-create")}
          >
            <span>Create Course</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22" height="22" viewBox="0 0 24 24" fill="#6ac3d1ff"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={i.buttonCreate}
            >
              <circle cx="12" cy="12" r="10" fill="#278d9cff" />
              <line x1="12" y1="6" x2="12" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"></line>
              <line x1="6" y1="12" x2="18" y2="12"></line>
            </svg>
          </Button>
        </div>
      </section>
    </div>
  );
}
