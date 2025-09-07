import { Routes, Route } from "react-router-dom";
import EntryPage from "./pages/EntryPage/EntryPage";
import StudentMyCourses from "./pages/StudentMyCourses/StudentMyCourses";
import StudentEnrollment from "./pages/StudentEnrollment/StudentEnrollment";
import CourseDetail from "./pages/StudentEnrollment/CourseDetail";

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/student/my-courses" element={<StudentMyCourses />} />
      <Route path="/student/enrollment" element={<StudentEnrollment />} />
      <Route path="/student/enrollment/:courseId" element={<CourseDetail />} />
    </Routes>
  );
}