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
    path('courses/<str:pk>/detail/', CourseDetailView.as_view(), name="courses-detail"),
    #Number of students showing, use {params: {course_id}} within get() or lesson_id or classroom_id 
    path("show/", StudentsEnrolledView.as_view(), name="show-enrolled"),

    
    #Instructors
    path("instructor/login/", InstructorLogin.as_view(), name="instructor-login"),
    #Instructors Courses
    path('instructor/courses/', InstructorCoursesView.as_view(), name="courses"),
    #Instructors Classrooms
    path("instructor/<str:lesson_id>/classrooms/", ClassroomView.as_view(), name="classrooms"),
    #Show number of students

    
    #Students login TODO
    path("instructor/login/", InstructorLogin.as_view(), name="instructor-login"),
    #Student Courses
    path("student/<int:student_profile_id>/my_courses/", StudentEnrolledCourses.as_view(), name="my-courses"),
    path("student/<int:student_profile_id>/courses/unenrolled/", StudentUnenrolledCourses.as_view(), name="enrollment"),
    path("student/<int:student_profile_id>/courses/enroll/", StudentUnenrolledCourses.as_view(), name="enroll"),
    #Students Classrooms
    path("student/<int:student_profile_id>/classooms/unenrolled/", StudentUnenrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    path("student/<int:student_profile_id>/classooms/enrolled/", StudentEnrolledClassrooms.as_view(), name="enrolled-classrooms"),
    path("student/<int:student_profile_id>/classooms/enroll/", StudentUnenrolledClassrooms.as_view(), name="unenrolled-classrooms"),
    #logout 
    path("user/logout/", UserLogout.as_view(), name="logout")
    
]
