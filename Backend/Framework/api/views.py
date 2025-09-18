from django.shortcuts import render, redirect
from .forms import CoursesForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CourseSerializer, StudentSerializer, LessonSerializer
from .models import Course, Student, Lesson
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

# Create your views here.
def course_creation(request):
    if request.method == 'POST':
        form = CoursesForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('create_courses')
    else:
        form = CoursesForm()

    return render(request, 'course.html', {'form' : form})

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
Lesson part
"""
@method_decorator(csrf_exempt, name='dispatch')
class LessonsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        lessons = course.lessons.all()
        data = LessonSerializer(lessons, many=True).data
        return Response(data)
    
    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        data = request.data.copy()
        data["courses"] = course.pk
        serializer = LessonSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status= 400)
        
@method_decorator(csrf_exempt, name='dispatch')
class LessonDetailView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        data = LessonSerializer(lesson).data
        return Response(data)

"""
Student Part
"""
class StudentEnrolledCourses(APIView):
    permission_classes = [AllowAny]
    def get(self, request, student_profile_id):
        student = get_object_or_404(Student, student_profile_id = student_profile_id)
        res = student.courses.all()
        data = CourseSerializer(res, many=True).data
        return Response(data)

class StudentUnenrolledCourses(APIView):
    permission_classes = [AllowAny]
    def get(self, request, student_profile_id):
        student = get_object_or_404(Student, student_profile_id = student_profile_id)
        enrolled_ids = student.courses.values_list("pk", flat = True) #gives list of pk values (course_ids)
        res = Course.objects.exclude(pk__in=enrolled_ids) #Exclude by pk
        data = CourseSerializer(res, many=True).data
        return Response(data)
    
class StudentEnroll(APIView):
    permission_classes=[AllowAny]
    def post(self, request, student_profile_id):
        student = get_object_or_404(Student, student_profile_id=student_profile_id)
        course_id = request.data.get("course_id")
        if not course_id:
            return Response({"detail": "course_id is required"})

        course = get_object_or_404(Course, pk=course_id)

        if student.courses.filter(pk=course.pk).exists():
            # idempotent: already enrolled
            return Response(
                {"detail": "Student already enrolled", "course": CourseSerializer(course).data},
            )

        student.courses.add(course)
        return Response(CourseSerializer(course).data)



"""
class StudentEnrolledCourses(APIView):
    def get(self, student_id):
        #Grab current student if 
        try:
            #Checking if the student exists.
            student = StudentProfile.objects.get(pk=student_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

        enrolled_courses = Course.objects.filter(enrollments__student=student)
        serializer = CourseSerializer(enrolled_courses, many=True)
        return Response(serializer.data, status=200)


class StudentUnenrolledCourses(APIView):
    def get(self, student_id):
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
        if not created: #If the way it's fetched is not created 
            return Response({'error': 'Already enrolled'}, status=400)

        serializer = EnrollmentSerializer(enrollment)
        
        return Response(serializer.data, status=201)
"""
