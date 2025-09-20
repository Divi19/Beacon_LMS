from contextvars import Token

from .forms import *

#django 
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login, logout 
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password

#Res
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.generics import RetrieveAPIView 

#Inner
from .serializers import *
from .models import *
from .auth import CustomJWTAuthentication



"""
Shared Part
"""
class UserLogout(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
class CurrentUser(RetrieveAPIView):#Receiving a single object, read-only
    authentication_classes = [CustomJWTAuthentication] 
    permission_classes = [IsAuthenticated]
    serializer_class = CurrentUserSerializer
    def get_object(self):
        return self.request.user #According to the json upon logged in, the user nested content


"""
Instructor Part
"""
"""
Authentication for Instructors 
Instructor login function using simple Jwt
https://medium.com/@preciousimoniakemu/create-a-react-login-page-that-authenticates-with-django-auth-token-8de489d2f751 
https://www.youtube.com/watch?v=1pIrRTxGnJ4
"""

class InstructorLogin(APIView): 
    """
    Posting login request. 
    """
    permission_classes = [AllowAny]
    authentication_classes = [] #Bypassing authentication

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user'] #in the post json
        token = RefreshToken.for_user(user) #Creates a token

        instructor = (
            InstructorProfile.objects
            .select_related("user")
            .filter(user=user)
            .first()
        )
        if not instructor:
            # Auth succeeded, but user lacks instructor privileges
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        
        payload = {
            "access": str(token.access_token),
            "refresh": str(token),
            "user": {
                "instructor_profile_id": instructor.instructor_profile_id,
                "full_name": instructor.full_name,
                "role": "instructor",
                "email": user.email,
                "user_id": user.user_id,
            },
        }
        return Response(payload, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class InstructorCoursesView(APIView):
    """
    Instructor viewing own created courses
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 

    def get(self, request):
        """
        GET method. Fetching course and returning a customised json response
        """
        user = self.request.user
        instr = InstructorProfile.objects.filter(user=user).first()
        if not instr:
            return Response({"detail": "Not an instructor."}, status=403)
        courses = Course.objects.filter(owner_instructor=instr).select_related("owner_instructor") if instr else Course.objects.none()
        output = [{
                "course_id": course.course_id,
                "course_title": course.title,
                "course_code": course.code,
                "course_credits": course.credits,
                "course_director": course.owner_instructor.full_name,
                "course_description": course.description}
                   for course in courses]
        return Response(output, status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        POST method. Creating a new course
        """
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save() 
            return Response(serializer.data,  status=status.HTTP_201_OK)

#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, pk):
        """
        GET method. Fetching course and returning a customised json response
        """
        course = Course.objects.get(course_id=pk)
        output = {
            "course_id": course.course_id,
            "course_title": course.title,
            "course_code": course.code,
            "course_credits": course.credits,
            "course_director": course.owner_instructor.full_name,
            "course_description": course.description}
        return Response(output, status=status.HTTP_200_OK)
    
class ClassroomView(APIView):
    """
    Classrooms specific to instructors 
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 

    def get(self, request, pk):
        """
        GET method. Receive current lesson pk and instructor to differentiate between classrooms
        and to show classrooms specific to instructors. Customised json response returned
        """
        #Receiving instructor 
        user = self.request.user
        instr = InstructorProfile.objects.filter(user=user).first()
        #Reveiving lessons  
        lesson = Lesson.objects.get(lesson_id=pk)
        classrooms = Classroom.objects.filter(lesson=lesson, instructor=instr) if instr and lesson else Classroom.objects.none()
        if not instr:
            return Response({"detail": "Not an instructor."}, status=403)
        if not lesson:
            return Response({"detail": "No related lessons."}, status=403)
        output =[{
                "day_of_week": classroom.day_of_week,
                "time_start": classroom.time_start,
                "time_end": classroom.time_end,
                "instructor": classroom.instructor,
                    } for classroom in classrooms]
        return Response(output,  status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        POST method. Creating classrooms
        """
        serializer = ClassroomSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save() 
            return Response(serializer.data,  status=status.HTTP_201_OK)

"""
Student Part
"""
class StudentEnrolledCourses(APIView):
    permission_classes = [AllowAny]
    def get(self, request, student_profile_id):
        """
        Fetching all enrolled course 
        - Look for the student 
        - Reverse relationship to grab enrolled courses
        - Parse and return json 
        """
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        courses = Course.objects.filter(status=Course.CourseStatus.ACTIVE, enrollment__student=student).distinct() 
        output = [{
                "course_id": course.course_id,
                "course_title": course.title,
                "course_code": course.code,
                "course_credits": course.credits,
                "course_director": course.owner_instructor.full_name,
                "course_description": course.description}
                for course in courses]
        return Response(output, status=status.HTTP_200_OK)

class StudentUnenrolledCourses(APIView):
    permission_classes = [AllowAny]
    def get(self, request, student_profile_id):
        """
        Fetching all unenrolled course 
        - Look for the student 
        - Reverse relationship to grab unenrolled courses
        - Parse and return json 
        """
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        #Grab all courses that are not enrolled using backward relationship
        courses = Course.objects.filter(status=Course.CourseStatus.ACTIVE).exclude(enrollment__student=student).distinct() #Preventing duplicate courses
        output = [{
            "course_id": course.course_id,
            "course_title": course.title,
            "course_code": course.code,
            "course_credits": course.credits,
            "course_director": course.owner_instructor.full_name,
            "course_description": course.description}
            for course in courses]
        return Response(output, status=status.HTTP_200_OK)
    
    def post(self, request, student_profile_id):
        """
        Enroll a student
        - Look for the student 
        - Create new Enrollment objects
        """
        student = get_object_or_404(StudentProfile, pk=student_profile_id)
        #Checking if course id is present and if student has already enrolled 
        serializer = EnrollmentSerializer(
            data=request.data,
            context={"student": student},
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return Response(EnrollmentSerializer(enrollment).data, status=201)

class StudentUnenrolledClassrooms(APIView): 
    """
    TODO: change to authentication by removing student_profile_id.
    adding 
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    """
    permission_classes = [AllowAny]
    def get(self, request, student_profile_id, pk):
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        lesson = Lesson.objects.get(lesson_id = pk)
        unenrolled_classrooms = Classroom.objects.filter(lesson=lesson, is_active=True).exclude(classroomenrollment__student=student).distinct()
        output =[{
                "day_of_week": classroom.day_of_week,
                "time_start": classroom.time_start,
                "time_end": classroom.time_end,
                "instructor": classroom.instructor.full_name,
                    } for classroom in unenrolled_classrooms]
        return Response(output,  status=status.HTTP_200_OK)
    
    def post(self, request, student_profile_id):
        """
        Enroll a student
        - Look for the student 
        - Create new object
        """
        student = get_object_or_404(StudentProfile, pk=student_profile_id)
        #Checking if course id is present and if student has already enrolled 
        serializer = ClassroomEnrollmentSerializer(
            data=request.data,
            context={"student": student},
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()#Creating a new enrollment object
        return Response(ClassroomEnrollmentSerializer(enrollment).data, status=201)

class StudentEnrolledClassrooms(APIView): 
    permission_classes = [AllowAny]
    def get(self, request, student_profile_id, pk):
        student = get_object_or_404(StudentProfile, student_profile_id=student_profile_id)
        lesson = Lesson.objects.get(lesson_id = pk)
        enrolled_classrooms = Classroom.objects.filter(lesson=lesson,is_active = True).exclude(classroomenrollment__student=student).distinct()
        output =[{
                "day_of_week": classroom.day_of_week,
                "time_start": classroom.time_start,
                "time_end": classroom.time_end,
                "instructor": classroom.instructor.full_name,
                    } for classroom in enrolled_classrooms]
        return Response(output,  status=status.HTTP_200_OK)
    
    