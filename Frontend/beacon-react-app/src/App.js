import { Routes, Route } from "react-router-dom";
import EntryPage from "./pages/EntryPage/EntryPage";
import StudentMyCourses from "./pages/Student/StudentMyCourses/StudentMyCourses";
import CourseDetailEnrolled from "./pages/Student/StudentMyCourses/CourseDetailEnrolled";
import StudentEnrollment from "./pages/Student/StudentEnrollment/StudentEnrollment";
import CourseDetail from "./pages/Student/StudentEnrollment/CourseDetail";
import InstructorCourseCreation from "./pages/Instructor/Instructor Course Creation/InstructorCourseCreation";
import InstructorCourseCreate from "./pages/Instructor/Instructor Course Create/InstructorCourseCreate";
import InstructorCourseList from "./pages/Instructor/Instructor Course List/InstructorCourseList";
import InstructorCourseDescription from "./pages/Instructor/InstructorCourseDescription/InstructorCourseDescription";
import InstructorLogin from "./pages/Instructor/Instructor Login/InstructorLogin";
import InstructorLessonDetail from "./pages/Instructor/InstructorLessonDetail/InstructorLessonDetail"
import InstructorClassCreation from "./pages/Instructor/InstructorClassCreation/InstructorClassCreation";
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
      <Route path="/instructor/course/:courseId/lesson/:lessonId/classroom/new" element={<InstructorClassCreation />}/>
    </Routes>
  </div>
  );
}