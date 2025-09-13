from contextvars import Token
from django.shortcuts import render, redirect
from .forms import *
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import *
from .models import *
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout 
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken

"""
Instructor Part
"""

#For getting list of courses
@method_decorator(csrf_exempt, name='dispatch')
class FrontendView(APIView):
    def get(self, request):
        courses = Course.objects.all()
        output = [{"course_title": course.course_title,
                   "course_id": course.course_id,
                   "course_credits": course.course_credits,
                   "course_director": course.course_director,
                   "course_description": course.course_description}
                   for course in courses]
        return Response(output)
    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)

#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class FrontendDetailView(APIView):
    def get(self, request, pk):
        courses = Course.objects.get(course_id=pk)
        output = {"course_title": courses.course_title,
                   "course_id": courses.course_id,
                   "course_credits": courses.course_credits,
                   "course_director": courses.course_director,
                   "course_description": courses.course_description}
        return Response(output)
    
"""
Authentication for Instructors 
Instructor login function using simple Jwt
https://medium.com/@preciousimoniakemu/create-a-react-login-page-that-authenticates-with-django-auth-token-8de489d2f751 

"""


class InstructorLogin(APIView): 
    def instructor_login(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, email=email, password=password)
        if user is not None: 
            #if it's correct, generate new tokens
            token = RefreshToken.for_user(user)
            return Response({"access": str(token.access_token), "refresh": str(token)})
        else:
            return Response({"error": "Invalid login credentials"})
        

class StudentEnrolledCourses(APIView):
    def get(self, request, student_profile_id):
        """
        Fetching all enrolled course 
        - Look for the student 
        - Reverse relationship to grab enrolled courses
        - Parse and return json 
        """
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        qs = Course.objects.filter(enrollment__student=student).distinct()
        data = CourseSerializer(qs, many=True).data #parsing courses data to json
        return Response(data)

class StudentUnenrolledCourses(APIView):
    def get(self, request, student_profile_id):
        """
        Fetching all unenrolled course 
        - Look for the student 
        - Reverse relationship to grab unenrolled courses
        - Parse and return json 
        """
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        #Grab all courses that are not enrolled using backward relationship
        qs = Course.objects.exclude(enrollment__student=student).distinct() #Preventing duplicate courses
        data = CourseSerializer(qs, many=True).data
        return Response(data)

    
class StudentEnroll(APIView):
    def post(self, request, student_profile_id):
        """
        Enroll a student
        - Look for the student 
        - Look for course
        - Create new Enrollment objects
        """
        student = get_object_or_404(Student, student_profile_id=student_profile_id)
        course_id = request.data.get("course_id") #POST
        if not course_id:
            return Response({"detail": "course_id is required"})
        course = get_object_or_404(Course, pk=course_id)
        if Course.objects.filter(enrollment__student=student).distinct():
            #Filter the courses to see if already enrolled 
            return Response(
                {"detail": "Student already enrolled", "course": CourseSerializer(course).data},
            )
        enrollment = Enrollment.objects.create(student = student, course=course)
        data = EnrollmentSerializer(enrollment).data
        return Response(data)
        

