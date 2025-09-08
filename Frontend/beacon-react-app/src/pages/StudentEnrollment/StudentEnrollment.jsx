import { useNavigate } from "react-router-dom";
import StudentTopBar from "../../components/StudentTopBar/StudentTopBar";
import { useEnrollment } from "../../state/EnrollmentContext";
import allCourses from "../../data/courses";
import CourseCard from "../../components/CourseCard/CourseCard";
import s from "./StudentEnrollment.module.css";

export default function StudentEnrollment() {
  const { isEnrolled } = useEnrollment();
  const navigate = useNavigate();

  const available = allCourses.filter((c) => !isEnrolled(c.id));

  return (
    <>
      <StudentTopBar />
      <div className={s.wrap}>
        <header className={s.header}>
          <h1 className={s.title}>COURSE ENROLLMENT</h1>
        </header>

        <section className={s.grid}>
          {available.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onClick={() => navigate(`/student/enrollment/${c.id}`)}
              onCta={() => navigate(`/student/enrollment/${c.id}`)}
              ctaText="Enrol"
            />
          ))}
          {available.length === 0 && (
            <div className={s.empty}>
              You're enrolled in all available courses{" "}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
