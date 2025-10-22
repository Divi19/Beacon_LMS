"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from api.views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    #Fetch current logged in user
    path("user/", CurrentUser.as_view(), name="current-user"),

    #Course details - annotated with progress
    path('courses/<str:course_id>/detail/', CourseDetailView.as_view(), name="courses-detail"),
    
    #Number of students showing, use {params: {course_id}} within get() or lesson_id or classroom_id 
    path("instructor/show/enrolled/", EnrolledStudentList.as_view(), name="show-enrolled"),
    #Whole enrolled student progress for either lesson or course
        #One course 
    path("instructor/course/progress/<str:course_id>/", ProgressView.InstructorCourseProgress.as_view()),
        #One lesson 
    path("instructor/lesson/progress/<str:lesson_id>/", ProgressView.InstructorLessonProgress.as_view()),
        #One student 
    path("instructor/student/progress/<int:student_profile_id>/", ProgressView.InstructorStudentProgress.as_view()),

    #Instructors
    path("instructor/login/", InstructorLogin.as_view(), name="instructor-login"),
    #Instructors Courses - annotated with progress 
    path('instructor/courses/', InstructorCoursesView.as_view(), name="courses"),
    #Show Assignments, reading list, and prereqs in lesson form 
    path('instructor/assignments/<str:lesson_id>/',LessonViews.AssignmentTextView.as_view()),
    path('instructor/readings/<str:lesson_id>/',LessonViews.ReadingTextView.as_view()),
    path('instructor/prereqs/<str:lesson_id>/',LessonViews.PrereqsTextView.as_view()),
    #Instructors Classrooms
         #Own or unlinked classrooms 
    path("instructor/classrooms/own/", ClassroomViews.OwnClassroomsView.as_view(), name="classrooms"),
        #Course specific - sendParams
    path("instructor/course/classrooms/", ClassroomViews.ActiveClassroomsView.as_view(), name="classrooms"),
        #Lesson specific - sendParams 
    path("instructor/lesson/classrooms/", ClassroomViews.ActiveClassroomsView.as_view(), name="classrooms"),
       #POST Create Physical Classrooms
    path("instructor/classrooms/create/", ClassroomViews.CreateClassroomView.as_view()),
        #Linking classrooms
            #POST
    path("instructor/link_classrooms/link/<str:lesson_id>/", ClassroomViews.LinkingClassroomsView.as_view(), name="classrooms"),        #Creating physical classrooms
            #GET
    path("instructor/link_classrooms/get/<str:course_id>/", ClassroomViews.LinkingClassroomsView.as_view(), name="classrooms"),        #Creating physical classrooms

        #GET + POST Create and linking online classroom // showing online classrooms
    path("instructor/classrooms/online/<str:lesson_id>/", ClassroomViews.OnlineClassroomsView.as_view()),
    
    
    #Instructor Lessons 
    path("instructor/courses/<str:course_id>/lessons/bulk-create/", LessonViews.LessonBulkCreateView.as_view()),
    path("instructor/courses/<str:course_id>/lessons/", LessonViews.LessonsView.as_view(), name="get-lessons"), 
    path("instructor/courses/<str:course_id>/lessons/<str:lesson_id>/", LessonViews.LessonsView.as_view(), name="get-lessons"), #patching 
    path("instructor/lessons/<str:lesson_id>/detail/", LessonViews.LessonDetails.as_view(), name="get-lessons"),
    path("instructor/lessons/<str:lesson_id>/update/", LessonViews.LessonsView.as_view(), name="get-lessons"),
    #Instructor Lessons prerequisites 
    path("instructor/lessons/<str:lesson_id>/prerequisites/", LessonViews.LessonPrereqBulkCreateView.as_view()),
    #Instructor Reading 
    path("instructor/lessons/<str:lesson_id>/readings/", LessonViews.LessonReadingBulkCreateView.as_view()),
    #Instructor Assignment 
    path("instructor/lessons/<str:lesson_id>/assignments/", LessonViews.LessonAssignmentBulkCreateView.as_view()),

    #Admin login
    path("api/admin/login/", AdminView.AdminLogin.as_view(), name="admin-login"),
    path('api/admin/instructors/', AdminView.AdminInstructorListView.as_view(), name="admin-instructors"),
    path('api/admin/instructors/<int:instructor_id>/', AdminView.AdminInstructorDetailView.as_view(), name="admin-instructor-detail"),

    #Students login 
    path("student/login/", StudentLogin.as_view(), name="student-login"),
    #Student registration
    path("student/signup/", StudentRegister.as_view(), name="student-register"),
    path("student/profile/", StudentProfileView.as_view()),
    #Student Courses(No need student id in path since the JWT Token already identifies the student, safer approach as well)
    path("student/my_courses/", StudentEnrolledViews.StudentEnrolledCourses.as_view(), name="my-courses"),
    path("student/courses/unenrolled/", StudentUnenrolledViews.StudentUnenrolledCourses.as_view(), name="enrollment"),
    path("student/courses/enroll/", StudentUnenrolledViews.StudentUnenrolledCourses.as_view(), name="enroll"),
    #Student Lessons
    path("student/courses/<str:course_id>/lessons/enrolled/", StudentEnrolledViews.StudentEnrolledLessons.as_view(), name="enrolled-lessons"),
    path("student/courses/<str:course_id>/lessons/unenrolled/", StudentUnenrolledViews.StudentUnenrolledLessons.as_view(), name="unenrolled-lessons"),
    path("student/courses/<str:course_id>/lessons/enroll/<str:lesson_id>/", StudentUnenrolledViews.StudentUnenrolledLessons.as_view(), name="unenrolled-lessons"),
    path("student/courses/lesson/detail/<str:lesson_id>/", StudentUnenrolledViews.StudentLessonDetails.as_view()),
    path("student/courses/<str:course_id>/lessons/<str:lesson_id>/progress/", StudentLessonProgressView.as_view(), name="lesson-progress"),
    #Students Classrooms
    path("student/lessons/<str:lesson_id>/classrooms/unenrolled/", StudentUnenrolledViews.StudentUnenrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    path("student/lessons/<str:lesson_id>/classrooms/enroll/<str:classroom_id>/", StudentUnenrolledViews.StudentUnenrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    path("student/lessons/<str:lesson_id>/classrooms/enrolled/<str:classroom_id>/", StudentEnrolledViews.StudentEnrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    path("student/classrooms/viewing/", StudentClassrooms.as_view()),
    #Student Assignment
    path("student/lessons/<str:lesson_id>/assignments/", StudentAssignmentChecklistView.as_view(), name="student-lesson-assignment"),
    #Student Reading
    path("student/lessons/<str:lesson_id>/readings/", StudentReadingChecklistView.as_view(), name="student-lesson-reading"),

    #logout 
    path("user/logout/", UserLogout.as_view(), name="logout")
    
    
]
