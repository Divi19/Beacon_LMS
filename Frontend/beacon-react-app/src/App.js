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
// import InstructorLessonCreation from "./pages/InstructorLessonCreation";
import InstructorLessonCreate from "./pages/Instructor Lesson Create/InstructorLessonCreate";
import InstructorLessonList from "./pages/Instructor Lesson List/InstructorLessonList";
import InstructorLessonCreation from "./pages/Instructor Lesson Creation/InstructorLessonCreation"
import StudentMyCourses from "./pages/Student/StudentMyCourses/StudentMyCourses";
import CourseDetailEnrolled from "./pages/Student/StudentMyCourses/CourseDetailEnrolled";
import StudentEnrollment from "./pages/Student/StudentEnrollment/StudentEnrollment";
import CourseDetail from "./pages/Student/StudentEnrollment/CourseDetail";
import InstructorCourseCreation from "./pages/Instructor/Instructor Course Creation/InstructorCourseCreation";
import InstructorCourseCreate from "./pages/Instructor/Instructor Course Create/InstructorCourseCreate";
import InstructorCourseList from "./pages/Instructor/Instructor Course List/InstructorCourseList";
import InstructorCourseDescription from "./pages/Instructor/InstructorCourseDescription/InstructorCourseDescription";
import InstructorLogin from "./pages/Instructor/Instructor Login/InstructorLogin";
import InstructorLessonDetail from "./pages/Instructor/Instructor Lesson Detail/InstructorLessonDetail";
import InstructorClassCreation from "./pages/Instructor/Instructor Class Creation/InstructorClassCreation"; 
import StudentLessonDetail from "./pages/Student/StudentLessonDetail/StudentLessonDetail"


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
      <Route path="/instructor/course/:courseId/lessons" element={<InstructorLessonCreation />} />
      <Route path="/instructor/course/:courseId/lesson-list" element={<InstructorLessonList />} />
      {/* <Route path="/instructor/course/:courseId/lesson-create" element={<InstructorLessonCreate />} /> */}
      {/* Changed from Isabella version */}
      <Route path="/instructor/course/:courseId/lesson-creation" element={<InstructorLessonCreate />} /> 
      
      <Route path="/instructor/login" element={<InstructorLogin/>} />
      <Route path="/instructor/course/:courseId/lesson/:lessonId" element={<InstructorLessonDetail />}/>
      <Route path="/instructor/course/:courseId/lesson/:lessonId/classroom/new" element={<InstructorClassCreation />}/>
      <Route path="/student/course/:courseId/lesson/:lessonId" element={<StudentLessonDetail />}/>
    </Routes>
  </div>
  );
}