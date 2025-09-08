from django.shortcuts import render, redirect
from .forms import CoursesForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CourseSerializer, EnrollmentSerializer
from .models import Course, StudentProfile, User, Course, Enrollment
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny

"""
Instructor Part
"""

#For getting list of courses
@method_decorator(csrf_exempt, name='dispatch')
class FrontendView(APIView):
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]
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
    def get(self, request, student_id):
        try:
            student = StudentProfile.objects.get(pk=student_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

        enrolled_courses = Course.objects.filter(enrollments__student=student)
        serializer = CourseSerializer(enrolled_courses, many=True)
        return Response(serializer.data, status=200)


class StudentUnenrolledCourses(APIView):
    def get(self, request, student_id):
        try:
            student = StudentProfile.objects.get(pk=student_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

        unenrolled_courses = Course.objects.exclude(enrollments__student=student)
        serializer = CourseSerializer(unenrolled_courses, many=True)
        return Response(serializer.data, status=200)

    def post(self, request, student_id):
        course_id = request.data.get("course_id")

        try:
            student = StudentProfile.objects.get(pk=student_id)
            course = Course.objects.get(course_id=course_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)

        enrollment, created = Enrollment.objects.get_or_create(student=student, course=course)
        if not created:
            return Response({'error': 'Already enrolled'}, status=400)

        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=201)
