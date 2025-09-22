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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('courses/frontend/', FrontendView.as_view(), name="frontend"),
    path('courses/frontend/<str:pk>/', FrontendDetailView.as_view(), name="frontend-detail"),
    path('courses/<str:course_id>/lessons/', LessonsView.as_view(), name="course-lessons"),
    # path('lessons/<str:course_id>/', LessonDetailView.as_view(), name="lesson-detail"),
    #students
    #path('students/<str:student_id>/my_courses/', StudentEnrolledCourses.as_view(), name='my_courses'),
    #path('students/<str:student_id>/enrollment/', StudentUnenrolledCourses.as_view(), name='enrollment'),
    path("courses/frontend/<int:student_profile_id>/student/my_courses/", StudentEnrolledCourses.as_view(), name="my-courses"),
    path("courses/frontend/<int:student_profile_id>/student/enrollment/", StudentUnenrolledCourses.as_view(), name="my-courses"),
    path("courses/frontend/<int:student_profile_id>/student/enroll/", StudentEnroll.as_view(), name="my-courses"),
    # urls.py
    path('lessons/<str:lesson_id>/', LessonDetailView.as_view(), name="lesson-detail"),

   
]
