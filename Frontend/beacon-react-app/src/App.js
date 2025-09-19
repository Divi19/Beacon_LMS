import { Routes, Route } from "react-router-dom";
import EntryPage from "./pages/EntryPage/EntryPage";
import StudentMyCourses from "./pages/StudentMyCourses/StudentMyCourses";
import CourseDetailEnrolled from "./pages/StudentMyCourses/CourseDetailEnrolled";
import StudentEnrollment from "./pages/StudentEnrollment/StudentEnrollment";
import CourseDetail from "./pages/StudentEnrollment/CourseDetail";
import InstructorCourseCreation from "./pages/InstructorCourseCreation";
import InstructorCourseCreate from "./pages/Instructor Course Create/InstructorCourseCreate";
import InstructorCourseList from "./pages/Instructor Course List/InstructorCourseList";
import InstructorCourseDescription from "./pages/InstructorCourseDescription/InstructorCourseDescription";
import InstructorLogin from "./pages/InstructorLogin";
import InstructorLessonDetail from "./pages/Instructor Lesson detail/InstructorLessonDetail"
import axios from 'axios';
import React, {useState, useEffect} from "react";
  
export default function App(){
  const [details, setDetails] = useState([]);

  useEffect( () => {
    axios.get('http://localhost:8000/courses/frontend')
    .then(res => {
      setDetails(res.data);
    })
        .catch(err => {
          console.error('Error fetching data', err)
        });
      }, []);

    return (
      <div>
        {details.map((output, id) => (
          <div key={id}>
            <h2>{output.course_id}</h2>
            <h3>{output.course_title}</h3>
          </div>
        ))}

    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/student/my-courses" element={<StudentMyCourses />} />
      <Route path="/student/enrollment" element={<StudentEnrollment />} />
      <Route path="/student/enrollment/:courseId" element={<CourseDetail />} />
      <Route path="/student/course/:courseId" element={<CourseDetailEnrolled />} />
      <Route path="/instructor/courses/new" element={<InstructorCourseCreation />} />
      <Route path="/instructor/course-create" element={<InstructorCourseCreate />} />
      <Route path="/instructor/course-list" element={<InstructorCourseList />} />
      <Route path="/instructor/course/:courseId" element={<InstructorCourseDescription />} />
      <Route path="/instructor/login" element={<InstructorLogin/>} />
      <Route path="/instructor/course/:courseId/lesson/:lessonId" element={<InstructorLessonDetail />}/>
    </Routes>
  </div>
  );
}