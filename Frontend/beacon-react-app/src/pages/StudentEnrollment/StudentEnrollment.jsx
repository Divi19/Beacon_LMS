import { useNavigate } from "react-router-dom";
import StudentTopBar from "../../components/StudentTopBar/StudentTopBar";
import { useEnrollment } from "../../state/EnrollmentContext";
import allCourses from "../../data/courses";
import CourseCard from "../../components/CourseCard/CourseCard";
import s from "./StudentEnrollment.module.css";

export default function StudentEnrollment() {
  const { isEnrolled } = useEnrollment();
  const navigate = useNavigate();
  //Dummy value
  const student_id = 2
  //const available = allCourses.filter((c) => !isEnrolled(c.id));
  const [unenrolled, setUnenrolled] = useState([])
  const [submittingId, setSubmittingId] = useState(null);

  const fetchCourses = async () => {
    try {
      await axios.get(`http://localhost:8000/courses/frontend/${student_id}/student/enrollment/`).then(
        res => {
          setUnenrolled(res.data);
        }
      )
    } catch (err) {
      console.error("Error fetching unenrolled courses", err);
      alert("Failed to load available courses.");
    } 
  };

  const handleEnroll = async (courseId) => {
    try {
      setSubmittingId(courseId);
      await axios.post( `http://localhost:8000/courses/frontend/${student_id}/student/enroll/`, {
        course_id: courseId,
      });
      await fetchCourses(); // refresh after write so UI stays correct
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "Student already enrolled") {
        await fetchCourses();
      } else {
        console.error("Enrollment failed", err);
        alert(detail || "Failed to enroll in course.");
      }
    } finally {
      setSubmittingId(null);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

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
