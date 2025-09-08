
from django.shortcuts import redirect, render

#accessing local files
from . models import * 
from . serializer import * 

#rest 
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

#For later
@api_view(['POST']) #decorator takes a list of HTTP methods that view should respond to
class StudentRegistration(APIView):
    """
    Student registration (deferred)
    """
    def register(self, request):
        #serialize request data from user and store in serializer
        serializer = StudentSerializer(data=request.user) 
        if serializer.is_valid(): 
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.error)

@api_view(['POST']) 
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    return Response({"authenticated": True})
        
@permission_classes([IsAuthenticated])
class StudentLogin(APIView):
    """
    Student registration (deferred)
    """
    def login(self, request):
        return None
 

    
@api_view(['GET'])      
class StudentEnrolledCourses(APIView): 
    """
    Show all Enrolled courses
    """
    def getEnrolled(self, request, student_id):
        try:
            student = StudentProfile.objects.get(pk=student_id) #Grab from StudentProfile objects, a student with matching student_id
        except StudentProfile.DoesNotExist:
            return Response({'error':'Student Not Found'}, status=404)
        enrolled_courses = Course.objects.filter(enrollment__student=student) #inner join to enrollment
        serializer = CourseSerializer(enrolled_courses, many = True)
        return Response(serializer.data, status=202) #Give enrolled multiple courses 
    
   


@api_view(['GET', 'POST'])     
class StudentUnenrolledCourses(APIView):
    """
    Show all Unenrolled courses 
    """
    def getUnenrolled(self, request, student_id):
        try:
            student = StudentProfile.objects.get(pk=student_id) #Grab from StudentProfile objects, a student with matching student_id
        except StudentProfile.DoesNotExist:
            return Response({'error':'Student Not Found'}, status=404)
        
        enrolled_courses = Course.objects.exclude(enrollment__student=student) #inner join to enrollment
        serializer = CourseSerializer(enrolled_courses, many = True)
        return Response(serializer.data, status=202) #Give unenrolled, multiple courses 
    
    def enrol(self, request):
        student_id = request.data.get('student_id') #getting payload
        course_id = request.data.get('course_id') #getting payload 
    
        #Check if student or course exist
        try:
            student = StudentProfile.objects.get(pk=student_id)
            course = Course.objects.get(pk=course_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)

        # Check if already enrolled using PK of student and course (ids)
        if Enrollment.objects.filter(student=student, course=course).exists():
            return Response({'error': 'Already enrolled'}, status=400)

        #create new enrollment project 
        enrollment = Enrollment.objects.create(student=student, course=course) 
        serializer = EnrollmentSerializer(enrollment) #only one object
        return Response(serializer.data, status=201) #status: data created successfully

    
