import { Routes, Route } from "react-router-dom";
import EntryPage from "./pages/EntryPage/EntryPage";
import StudentMyCourses from "./pages/Student/StudentMyCourses/StudentMyCourses";
import CourseDetailEnrolled from "./pages/Student/StudentMyCourses/CourseDetailEnrolled";
import StudentEnrollment from "./pages/Student/StudentEnrollment/StudentEnrollment";
import StudentMyLessonsPage from "./pages/Student/StudentMyLessonsPage/StudentMyLessonsPage";

import CourseDetail from "./pages/Student/StudentEnrollment/CourseDetail";

import InstructorCourseCreation from "./pages/Instructor/Instructor Course Creation/InstructorCourseCreation";
import InstructorCourseCreate from "./pages/Instructor/Instructor Course Create/InstructorCourseCreate";
import InstructorCourseList from "./pages/Instructor/Instructor Course List/InstructorCourseList";
import InstructorCourseDescription from "./pages/Instructor/Instructor Course Description/InstructorCourseDescription";
import InstructorLogin from "./pages/Instructor/Instructor Login/InstructorLogin";

import InstructorLessonDetail from "./pages/Instructor/Instructor Lesson Detail/InstructorLessonDetail";
import InstructorLessonCreation from "./pages/Instructor/Instructor Lesson Creation/InstructorLessonCreation";
import InstructorLessonCreate from "./pages/Instructor/Instructor Lesson Create/InstructorLessonCreate";
import InstructorLessonList from "./pages/Instructor/Instructor Lesson List/InstructorLessonList";

import InstructorClassCreation from "./pages/Instructor/Instructor Class Creation/InstructorClassCreation"; 


import axios from 'axios';
import React, {useState, useEffect} from "react";
import StudentLessonEnroll from "./pages/Student/StudentLessonEnroll/StudentLessonEnroll";
import StudentLessonDetail from "./pages/Student/StudentLessonDetail/StudentLessonDetail";
import StudentLogin from "./pages/Student/Student Login/StudentLogin";
import StudentSignUp from "./pages/Student/Student Sign Up/StudentSignUp";
import StudentEnrollmentPage from "./pages/Student/StudentMyCourses/StudentMyCourses";
import StudentOwnLessons from "./pages/Student/StudentOwnLessons/StudentOwnLessons";
import StudentMyLessonsPage from "./pages/Student/StudentMyLessonsPage/StudentMyLessonsPage";

import AdminLogIn from "./pages/Admin/AdminLogIn/AdminLogIn";
import AdminMainPage from "./pages/Admin/AdminMainPage/AdminMainPage";
import AdminCreateInstructor from "./pages/Admin/AdminCreateInstructor/AdminCreateInstructor";
import AdminInstructorList from "./pages/Admin/AdminInstructorList/AdminInstructorList";

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
      {/* Student Side */}
      <Route path="/" element={<EntryPage />} />
      <Route path="/student/my-courses" element={<StudentEnrollmentPage />} />
      <Route path="/student/enrollment" element={<StudentEnrollment />} />
      <Route path="/student/enrollment/:courseId" element={<CourseDetail />} />
      <Route path="/student/course/:courseId" element={<CourseDetailEnrolled />} />
      <Route path="/student/login" element={<StudentLogin/>} />
      <Route path="/student/signup" element={<StudentSignUp/>} />


      {/* Instructor Side */}
      {/* Courses */}
      <Route path="/instructor/courses/new" element={<InstructorCourseCreation />} />
      <Route path="/instructor/course-create" element={<InstructorCourseCreate />} />
      <Route path="/instructor/course-list" element={<InstructorCourseList />} />
      <Route path="/instructor/course/:courseId" element={<InstructorCourseDescription />} />
      <Route path="/instructor/login" element={<InstructorLogin/>} />
      
      {/* Lessons */}
      <Route path="/instructor/course/:courseId/lesson/:lessonId" element={<InstructorLessonDetail />}/>
      <Route path="/student/course/:courseId/my-lessons" element={<StudentMyLessonsPage />}/>
      <Route path="/student/course/:courseId/lesson-enroll" element={<StudentLessonEnroll />}/>
      <Route path="/student/course/:courseId/lesson/:lessonId" element={<StudentLessonDetail />}/>
      {/*<Route path="/instructor/course/:courseId/lessons/:lessonId" element={<InstructorLessonCreation />} />*/}
      <Route path="/instructor/course/:courseId/lesson-list" element={<InstructorLessonList />} />
      <Route path="/instructor/course/:courseId/lesson-creation/:lessonId" element={<InstructorLessonCreate />} /> 

      {/* <Route path="/instructor/course/:courseId/lesson-create" element={<InstructorLessonCreate />} /> */}
      {/* Changed from Isabella version */}

      {/* Classrooms */}
      <Route path="/instructor/course/:courseId/lesson/:lessonId/classroom/new" element={<InstructorClassCreation />}/>
      <Route path="/admin/log-in" element={<AdminLogIn />}/>
      <Route path="/admin/main-page" element={<AdminMainPage />}/>
      <Route path="/admin/create-instructor" element={<AdminCreateInstructor />}/>
      <Route path="/admin/instructor-list" element={<AdminInstructorList />}/>
      <Route path="/student/own-lessons" element={<StudentOwnLessons />}/>
      <Route path="/student/my-lesson" element={<StudentMyLessonsPage />}/>
      <Route path="/student/course/:courseId/lesson-creation/:lessonId" element={<StudentLessonEnroll />}/>

      

    </Routes>
  </div>
  );
}