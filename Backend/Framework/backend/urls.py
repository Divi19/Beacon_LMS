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

    #Course details
    path('courses/<str:course_id>/detail/', CourseDetailView.as_view(), name="courses-detail"),
    #Number of students showing, use {params: {course_id}} within get() or lesson_id or classroom_id 
    path("show/", StudentsEnrolledView.as_view(), name="show-enrolled"),
    
    #Instructors
    path("instructor/login/", InstructorLogin.as_view(), name="instructor-login"),
    #Instructors Courses
    path('instructor/courses/', InstructorCoursesView.as_view(), name="courses"),
    path("instructor/courses/<str:course_id>/", ActiveClassroom.as_view()),
    #Instructors Classrooms
    path("instructor/<str:lesson_id>/classrooms/", ClassroomView.as_view(), name="classrooms"),
    #Instructor Lessons 
    path("instructor/courses/<str:course_id>/lessons/bulk-create/", LessonBulkCreateView.as_view()),
    path("instructor/courses/<str:course_id>/lessons/", LessonsView.as_view(), name="get-lessons"), 
    path("instructor/courses/<str:course_id>/lessons/<str:lesson_id>", LessonsView.as_view(), name="get-lessons"), #patching 
    path("instructor/lessons/<str:lesson_id>/detail/", LessonDetails.as_view(), name="get-lessons"),
    path("instructor/lessons/<str:lesson_id>/create/", LessonsView.as_view(), name="get-lessons"),
    path("instructor/lessons/<str:lesson_id>/prerequisites/bulk-create/", LessonPrereqBulkCreateView.as_view()),
    
    
    #Students login TODO
    path("student/login/", StudentLogin.as_view(), name="student-login"),
    #Student registration
    path("student/signup/", StudentRegister.as_view(), name="student-register"),
    #Student Courses(No need student id in path since the JWT Token already identifies the student, safer approach as well)
    path("student/my_courses/", StudentEnrolledCourses.as_view(), name="my-courses"),
    path("student/courses/unenrolled/", StudentUnenrolledCourses.as_view(), name="enrollment"),
    path("student/courses/enroll/", StudentUnenrolledCourses.as_view(), name="enroll"),
    #Student Lessons
    path("student/courses/<str:course_id>/lessons/enrolled/", StudentEnrolledLessons.as_view(), name="enrolled-lessons"),
    path("student/courses/<str:course_id>/lessons/unenrolled/", StudentUnenrolledLessons.as_view(), name="unenrolled-lessons"),
    path("student/courses/<str:course_id>/lessons/enroll/<str:lesson_id>/", StudentUnenrolledLessons.as_view(), name="unenrolled-lessons"),
    #Students Classrooms
    path("student/lessons/<str:lesson_id>/classrooms/unenrolled/", StudentUnenrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    path("student/lessons/<str:lesson_id>/classrooms/enroll/<str:classroom_id>/", StudentUnenrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    #logout 
    path("user/logout/", UserLogout.as_view(), name="logout")
    
    
]
