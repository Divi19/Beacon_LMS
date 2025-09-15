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
"""
Authentication for Instructors 
Instructor login function using simple Jwt
https://medium.com/@preciousimoniakemu/create-a-react-login-page-that-authenticates-with-django-auth-token-8de489d2f751 

"""

class InstructorLogin(APIView): 
    """
    Posting login request. 
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data) #Parse request to fetch valid email and password
        serializer.is_valid(raise_exception=True) 
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(request, email=email, password=password)

        if user is not None or  not InstructorProfile.objects.filter(user__email__iexact=email).exists(): 
            #Check if the email exists within existing instructors
            #if it's correct, generate new tokens
            token = RefreshToken.for_user(user)
            return Response({"access": str(token.access_token), "refresh": str(token)})
        else:
            return Response({"error": "Invalid login credentials"})
        

@method_decorator(csrf_exempt, name='dispatch')
class InstructorCoursesView(APIView):
    def get(self, request):
        """
        Fetching course and returning a customised json response
        """
        courses = Course.objects.all()
        output = [{"course_title": course.course_title,
                   "course_id": course.course_id,
                   "course_credits": course.course_credits,
                   "course_director": course.course_director,
                   "course_description": course.course_description}
                   for course in courses]
        return Response(output)
    
    def post(self, request):
        """
        Creating a new course
        """
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save() 
            return Response(serializer.data)

#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class CourseDetailView(APIView):
    """
    Fetching course and returning a customised json response
    """
    def get(self, request, pk):
        courses = Course.objects.get(course_id=pk)
        output = {"course_title": courses.course_title,
                   "course_id": courses.course_id,
                   "course_credits": courses.course_credits,
                   "course_director": courses.course_director,
                   "course_description": courses.course_description}
        return Response(output)

"""
Student Part
"""

class StudentEnrolledCourses(APIView):
    def get(self, request, student_profile_id):
        """
        Fetching all enrolled course 
        - Look for the student 
        - Reverse relationship to grab enrolled courses
        - Parse and return json 
        """
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        courses = Course.objects.filter(enrollment__student=student).distinct() 
        output = [{"course_title": course.course_title,
                   "course_id": course.course_id,
                   "course_credits": course.course_credits,
                   "course_director": course.course_director,
                   "course_description": course.course_description}
                   for course in courses]
        return Response(output)

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
        courses = Course.objects.exclude(enrollment__student=student).distinct() #Preventing duplicate courses
        output = [{"course_title": course.course_title,
                   "course_id": course.course_id,
                   "course_credits": course.course_credits,
                   "course_director": course.course_director,
                   "course_description": course.course_description}
                   for course in courses]
        return Response(output)

    
class StudentEnroll(APIView):
    def post(self, request, student_profile_id):
        """
        Enroll a student
        - Look for the student 
        - Look for course
        - Create new Enrollment objects
        """
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        course_id = request.data.get("course_id") #POST
        #Checking if course id is present and if student has already enrolled 
        if not course_id:
            return Response({"detail": "course_id is required"})
        if not student:
            return  Response({"detail": "student is unregistered"})
        
        serializer = EnrollmentSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save() 
        return Response(serializer.data)
        

