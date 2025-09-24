from contextvars import Token

from .forms import *

#django 
from django.shortcuts import render, redirect
from .forms import CoursesForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CourseSerializer, StudentSerializer, LessonSerializer
# from .models import Course, Student, Lesson
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login, logout 
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import IntegrityError
from django.db.models import OuterRef, Subquery, Q
from django.db.models import Count

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
#Have to remove maybe???
#For getting list of courses
# @method_decorator(csrf_exempt, name='dispatch')
# class FrontendView(APIView):
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

class InstructorCoursesView(APIView):
    """
    Instructor viewing and creating own courses.
    GET: List courses owned by the logged-in instructor.
    POST: Create a new course owned by the instructor and auto-generate lessons.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        user = request.user
        # Get the instructor profile of the logged-in user
        instr = InstructorProfile.objects.filter(user=user).first()
        if not instr:
            return Response({"detail": "Not an instructor."}, status=403)

        # Filter courses owned by this instructor
        courses = (
            Course.objects.filter(owner_instructor=instr)
            .select_related("owner_instructor")
            .annotate(enrolled_count=Count("enrollment", distinct=True))
        )

        output = [
            {
                "course_id": course.course_id,
                "code": course.code,
                "course_title": course.course_title,
                "course_credits": course.course_credits,
                "course_director": course.owner_instructor.full_name,
                "course_description": course.course_description,
                "course_number_of_lessons": course.course_number_of_lessons,
                "enrolled_count": getattr(course, "enrolled_count", 0),
            }
            for course in courses
        ]
        return Response(output, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        instr = InstructorProfile.objects.filter(user=user).first()
        if not instr:
            return Response({"detail": "Not an instructor."}, status=403)

        # Automatically set owner_instructor in serializer context
        serializer = CourseSerializer(data=request.data, context={"instructor": instr})
        if serializer.is_valid():
            # Save course and assign owner_instructor
            course = serializer.save(owner_instructor=instr)

            num_lessons = getattr(course, "course_number_of_lessons", 0) or 0
            for i in range(num_lessons):
                Lesson.objects.create(
                    # lesson_id=f"{course.course_id}_L{i+1}",
                    lesson_title=f"Lesson {i+1}",
                    lesson_description="",
                    lesson_objectives="",
                    lesson_duration_weeks=4,
                    lesson_status=Lesson.LessonStatus.ACTIVE,
                    lesson_prerequisite="",
                    courses=course,
                    lesson_created_by=instr
                )

            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

class ClassroomView(APIView):
    """
    Classrooms specific to instructors 
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 

    def get(self, request, lesson_id):
        """
        GET method. Receive current lesson pk and instructor to differentiate between classrooms
        and to show classrooms specific to instructors. Customised json response returned
        """
        #Receiving instructor 
        user = self.request.user
        instr = InstructorProfile.objects.filter(user=user).first()
        #Receiving lessons  
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
        if not instr:
            return Response({"detail": "Not an instructor."}, status=403)
        if not lesson:
            return Response({"detail": "No related lessons."}, status=403)
        classrooms = (Classroom.objects.filter(lesson=lesson, instructor=instr).annotate(enrolled_count=Count("classroomenrollment", distinct=True)) if instr and lesson else Classroom.objects.none())
        serializer = ClassroomSerializer(classrooms, many=True, context={"request": request})
        return Response(serializer.data,  status=status.HTTP_200_OK)
    
    def post(self, request, lesson_id):
        """
        POST method. Creating classrooms
        """
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        user = self.request.user
        try:
            instructor = InstructorProfile.objects.get(user=request.user)
        except InstructorProfile.DoesNotExist:
            raise serializers.ValidationError("This user is not an instructor.")
        ser = ClassroomSerializer(data=request.data, context={"request": request, "lesson": lesson})
        ser.is_valid(raise_exception=True)
        ser.is_valid(raise_exception=True)
        try:
            classroom = ser.save(lesson=lesson, instructor=instructor)
        except IntegrityError:
            return Response(
                {"detail": "A classroom with the same day & time already exists for this lesson."},
                status=400,
            )
        return Response(ClassroomSerializer(classroom, context={"request": request}).data, status=201)

class StudentsEnrolledView(APIView):
    """
    GET /api/students/enrolled?course_id=...&lesson_id=...&classroom_id=...&q=...&ordering=full_name
    - Provide any combination of course_id, lesson_id, classroom_id.
    - If multiple are provided, the result is the INTERSECTION (i.e., students satisfying all filters).
    - Optional 'q' searches name/student_no/email.
    - Optional 'ordering' (e.g., 'full_name', '-full_name', 'student_no').
    - Uses simple page params: page (1-based), page_size (default 25).


    use this: 
    const { data } = await api.get('/api/students/enrolled?course_id=AB1234');
        setStudents(data.results);      // list to display
        setTotal(data.count);
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 

    def get(self, request):
        course_id = request.query_params.get("course_id")
        lesson_id = request.query_params.get("lesson_id")
        classroom_id = request.query_params.get("classroom_id")
        q = request.query_params.get("q", "").strip()
        ordering = request.query_params.get("ordering", "full_name")
        page = max(int(request.query_params.get("page", 1) or 1), 1)
        page_size = min(max(int(request.query_params.get("page_size", 25) or 25), 1), 200)

        if not (course_id or lesson_id or classroom_id):
            return Response(
                {"detail": "Provide at least one of: course_id, lesson_id, classroom_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate referenced objects (and normalize to instances)
        course = lesson = classroom = None
        if course_id:
            course = get_object_or_404(Course, course_id=course_id)
        if lesson_id:
            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
        if classroom_id:
            classroom = get_object_or_404(Classroom, classroom_id=classroom_id)

        # Base queryset
        qs = StudentProfile.objects.all()
        # Apply filters (intersection semantics)
        if course:
            qs = qs.filter(enrollment__course=course)
        if lesson:
            qs = qs.filter(lessonenrollment__lesson=lesson)
        if classroom:
            qs = qs.filter(classroomenrollment__classroom=classroom)
        qs = qs.distinct()

        # Ordering (whitelist)
        allowed_order = {"full_name", "-full_name", "student_no", "-student_no", "enrolled_at", "-enrolled_at"}
        if ordering not in allowed_order:
            ordering = "full_name"
        qs = qs.order_by(ordering)

        # Pagination
        total = qs.count() #the number of students
        start = (page - 1) * page_size
        end = start + page_size
        items = list(qs[start:end])

        ser = StudentSerializer(items, many=True)
        return Response({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": ser.data
        }, status=status.HTTP_200_OK)


"""
Lesson part
"""

class LessonsView(APIView):
    """
    Lessons specific to a course
    """
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        """
        GET all lessons for a course
        """
        course = get_object_or_404(Course, course_id=course_id)
        lessons = course.lessons.all()
        serializer = LessonSerializer(lessons, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        """
        POST create a new lesson for a course
        """
        course = get_object_or_404(Course, course_id=course_id)
        data = request.data.copy()
        data["courses"] = course.course_id
        serializer = LessonSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return Response(LessonSerializer(lesson, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)


class LessonDetailView(APIView):
    """
    Lesson detail / update
    """
    permission_classes = [AllowAny]

    def get(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        serializer = LessonSerializer(lesson, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        serializer = LessonSerializer(lesson, data=request.data, context={"request": request}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK) 

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
        -Ensure not exceed capacity 
        - Create new object
        """
        student = get_object_or_404(StudentProfile, pk=student_profile_id)
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
    
    """
Shared
"""
#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class CourseDetailView(APIView):
    #permission_classes = [IsAuthenticated]
    #authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, pk):
        """
        GET method. Fetching course and returning a customised json response
        """
        course = Course.objects.get(course_id=pk)
        output = {
            "course_id": course.course_id,
            "course_title": course.course_title,
            "course_credits": course.course_credits,
            "course_director": course.course_director,
            "course_description": course.course_description}
        return Response(output, status=status.HTTP_200_OK)
    

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

# class StudentUnenrolledCourses(APIView):
#     permission_classes = [AllowAny]
#     def get(self, request, student_profile_id):
#         student = get_object_or_404(Student, student_profile_id = student_profile_id)
#         enrolled_ids = student.courses.values_list("pk", flat = True) #gives list of pk values (course_ids)
#         res = Course.objects.exclude(pk__in=enrolled_ids) #Exclude by pk
#         data = CourseSerializer(res, many=True).data
#         return Response(data)
    
# class StudentEnroll(APIView):
#     permission_classes=[AllowAny]
#     def post(self, request, student_profile_id):
#         student = get_object_or_404(Student, student_profile_id=student_profile_id)
#         course_id = request.data.get("course_id")
#         if not course_id:
#             return Response({"detail": "course_id is required"})

#         course = get_object_or_404(Course, pk=course_id)

#         if student.courses.filter(pk=course.pk).exists():
#             # idempotent: already enrolled
#             return Response(
#                 {"detail": "Student already enrolled", "course": CourseSerializer(course).data},
#             )

#         student.courses.add(course)
#         return Response(CourseSerializer(course).data)



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
