from contextvars import Token
import re 
from .forms import *

#django 
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login, logout 
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import IntegrityError, transaction
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
        courses =( Course.objects.filter(owner_instructor=instr).select_related("owner_instructor").annotate(enrolled_count=Count("enrollment__student", distinct=True)) if instr else Course.objects.none())
        output = [{
                "course_id": course.course_id,
                "course_title": course.title,
                "course_credits": course.credits,
                "course_director": course.owner_instructor.full_name,
                "course_description": course.description,
                "status": course.status,
                "enrolled_count": course.enrolled_count
                }
                   for course in courses]
        return Response(output, status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        POST method. Creating a new course
        """
        serializer = CourseSerializer(data=request.data, context={"request": request})
        if serializer.is_valid(raise_exception=True):
            serializer.save() 
            return Response(serializer.data,  status=status.HTTP_200_OK)


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
        try:
            classroom = ser.save(lesson=lesson, instructor=instructor)
        except IntegrityError:
            return Response(
                {"detail": "A classroom with the same day & time already exists for this lesson."},
                status=400,
            )
        return Response(ClassroomSerializer(classroom, context={"request": request}).data, status=201)

class ActiveClassroom(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, course_id):
        # have a Course instance
        course = get_object_or_404(Course, course_id=course_id)
        # all classrooms for that course
        qs = (Classroom.objects
            .filter(lesson__course=course)           # join via Lesson
            .select_related('lesson', 'instructor')  # avoid N+1
            .order_by('day_of_week', 'time_start'))
        return Response(ClassroomSerializer(qs, many=True).data)
"""
Lessons 
"""

@method_decorator(csrf_exempt, name='dispatch')
class LessonsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, course_id):
        """
        GET method. Retrieving Lessons
        """
        course = get_object_or_404(Course, course_id=course_id)
        lessons = Lesson.objects.filter(course = course).annotate(enrolled_count=Count("lessonenrollment", distinct=True)) 
        data = LessonOutSerializer(lessons, many=True).data
        return Response(data)
    
    def post(self, request, course_id):
        """
        POST Method: Creating lessons?  TODO: might be redundant 
        """
        course = get_object_or_404(Course, course_id=course_id)
        user = self.request.user #Grabbing current auth user 
        try:
            instructor = InstructorProfile.objects.get(user=request.user)
        except InstructorProfile.DoesNotExist:
            raise serializers.ValidationError("This user is not an instructor.")
        ser = ClassroomSerializer(data=request.data, context={"request": request, "course_id": course.course_id})
        ser.is_valid(raise_exception=True)
        ser.save() 
        return Response(ser.data)
    
    def patch(self, request, lesson_id):
        """
        Update only changed parts
        """
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
        ser = LessonSerializer(lesson, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_200_OK)
    
class LessonDetails(APIView): 
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, lesson_id):
        """
        GET method. Retrieving Lessons
        """
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
        lesson_id =  models.CharField(primary_key=True, max_length=6, unique=True, default=generate_custom_id, editable=False)
        output = {
            "lesson_id": lesson.lesson_id,
            "title": lesson.title,
            "credits": lesson.credits,
            "description": lesson.description,
            "objectives": lesson.objectives, 
            "duration_weeks":lesson.duration_weeks,
            "status": lesson.status,
            "created_by": lesson.created_by.full_name
        }
        return Response(output, status=status.HTTP_200_OK)



class LessonBulkCreateView(APIView):
    """
    POST /api/courses/<course_id>/lessons/bulk-create/
    {
      "count": 10,
      "credits": 10,
      "base_title": "Lesson",
      "starting_number": 1,   # optional
      "duration_weeks": 4,
      "status": "Active",
      "description": "...",
      "objectives": "..."
    }
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def _get_instructor(self, user):
        return InstructorProfile.objects.filter(user=user).first()

    def _course_prefix(self, course):
        # 'CL001' -> 'CL' (alpha prefix); if you want full 'CL001', just `return course.course_id`
        m = re.match(r"([A-Za-z]+)", course.course_id or "")
        return m.group(1) if m else (course.course_id or "")

    def _format_lesson_id(self, course, n: int) -> str:
        # e.g. 'CL-LES001' (3 digits; change to 2 if you like)
        return f"{self._course_prefix(course)}-LES{n:03d}"

    def post(self, request, course_id):
        # 1) course
        try:
            course = Course.objects.get(course_id=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        # 2) payload
        ser = LessonBulkCreateInSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        count           = data["count"]
        credits         = data["credits"]
        base_title      = data["base_title"]
        starting_number = data.get("starting_number")
        duration_weeks  = data["duration_weeks"]
        status_str      = data["status"]
        description     = data.get("description")
        objectives      = data.get("objectives")

        inst = self._get_instructor(request.user)
        now = timezone.now()

        # 3) create in a transaction to avoid race conditions
        with transaction.atomic():
            # Lock existing lessons for this course so numbering is safe
            existing_ids = list(
                Lesson.objects
                      .select_for_update()
                      .filter(course=course)
                      .values_list("lesson_id", flat=True)
            )

            # Extract already-used numeric parts from IDs like 'CL-LES001'
            used_numbers = set()
            for lid in existing_ids:
                m = re.search(r'LES(\d+)$', lid or '')
                if m:
                    used_numbers.add(int(m.group(1)))

            # Decide where to start
            next_n = starting_number if starting_number else (max(used_numbers) + 1 if used_numbers else 1)

            if (max(used_numbers) if used_numbers else 0) + count > 999:
                 return Response({"detail": "Exceeds maximum of 999 lessons per course."}, status=400)

            new_lessons = []
            # Build desired lessons, skipping any collisions
            for _ in range(count):
                while True:
                    candidate = self._format_lesson_id(course, next_n)
                    if candidate not in existing_ids and not Lesson.objects.filter(lesson_id=candidate).exists():
                        break
                    next_n += 1  # bump to next free number

                new_lessons.append(Lesson(
                    lesson_id=candidate,          # <- lesson_id IS the code
                    course=course,
                    credits=credits,
                    title=f"{base_title} {next_n}",
                    description=description,
                    objectives=objectives,
                    duration_weeks=duration_weeks,
                    status=status_str,
                    # designer_id = inst,
                    created_by=inst,
                    created_at=now,
                ))

                existing_ids.append(candidate)
                used_numbers.add(next_n)
                next_n += 1

            created = Lesson.objects.bulk_create(new_lessons, batch_size=100)

        out = LessonOutSerializer(created, many=True).data
        return Response({"created": out, "count": len(out)}, status=status.HTTP_201_CREATED)

class LessonPrereqView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, lesson_id):
        """
        GET method. Retrieving Prereq lessons 
        """
        lessons = LessonPrerequisite.objects.filter(lesson_id = lesson_id).annotate(enrolled_count=Count("lessonenrollment", distinct=True)) 
        data = LessonSerializer(lessons, many=True).data
        return Response(data)

class LessonPrereqBulkCreateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request, lesson_id):
        ser = LessonPrereqBulkInSerializer(data=request.data, context={"request": request, "lesson_id": lesson_id})
        ser.is_valid(raise_exception=True)
        lesson = ser.validated_data["lesson"]
        prereq_list = ser.validated_data["prereq_list"]
        mode = ser.validated_data["mode"]

        with transaction.atomic():
            if mode == "replace":
                LessonPrerequisite.objects.filter(lesson=lesson).delete()

            existing_ids = set(
                LessonPrerequisite.objects
                .filter(lesson=lesson)
                .values_list("prereq_lesson_id", flat=True)   # <-- use prereq_lesson_id
            )

            to_create = [
                LessonPrerequisite(lesson=lesson, prereq_lesson=p)  # <-- use prereq_lesson
                for p in prereq_list
                if p.pk not in existing_ids
            ]
            LessonPrerequisite.objects.bulk_create(to_create, batch_size=100)
        created = LessonPrerequisite.objects.filter(lesson=lesson).select_related("prereq_lesson")
        out = LessonPrereqOutSerializer(created, many=True).data
        return Response({"lesson_id": lesson.lesson_id, "prerequisites": out, "count": len(out)}, status=status.HTTP_201_CREATED)


"""
See student list 
"""
class StudentsEnrolledView(APIView):
    """
    GET /api/students/enrolled?course_id=...&lesson_id=...&classroom_id=...&q=...&ordering=full_name
    - Provide any combination of course_id, lesson_id, classroom_id.
    - If multiple are provided, the result is the INTERSECTION (i.e., students satisfying all filters).
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
        course_id = request.query_params.get("course_id") #query_params = accessing parameters within the url. 
        lesson_id = request.query_params.get("lesson_id")
        classroom_id = request.query_params.get("classroom_id")
        #q = request.query_params.get("q", "").strip()
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
        qs = qs.order_by('full_name').distinct()

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
Student Part
"""

class StudentRegister(APIView):
    permission_classes=[AllowAny]
    authentication_classes = []
    def post(self, request): 
        serializer = StudentSerializer(
            data = request.data, 
        )
        serializer.is_valid(raise_exception=True)
        student = serializer.save() 
        return Response(StudentSerializer(student).data, status=201)

class StudentLogin(APIView): 
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

        student = (
            StudentProfile.objects
            .select_related("user")
            .filter(user=user)
            .first()
        )
        if not student:
            # Auth succeeded, but user lacks instructor privileges
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        
        payload = {
            "access": str(token.access_token),
            "refresh": str(token),
            "user": {
                "student_profile_id": student.student_profile_id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "role": "student",
                "email": user.email,
                "user_id": user.user_id,
            },
        }
        return Response(payload, status=status.HTTP_200_OK)

class StudentEnrolledCourses(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    
    def get(self, request):
        """
        Fetching all enrolled course 
        - Look for the student 
        - Reverse relationship to grab enrolled courses
        - Parse and return json 
        """
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        courses = Course.objects.filter(status=Course.CourseStatus.ACTIVE, enrollment__student=student).distinct() 
        output = [{
                "course_id": course.course_id,
                "course_title": course.title,
                "course_credits": course.credits,
                "course_director": course.owner_instructor.full_name,
                "course_description": course.description
                }
                for course in courses]
        return Response(output, status=status.HTTP_200_OK)

class StudentEnroll(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]     
    def post(self, request):
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
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

class StudentUnenrolledCourses(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request):
        user = self.request.user
        """
        Fetching all unenrolled course 
        - Look for the student 
        - Reverse relationship to grab unenrolled courses
        - Parse and return json 
        """
        student = get_object_or_404(StudentProfile, user=user)
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
    
    def post(self, request):
        """
        Enroll a student
        - Look for the student 
        - Create new Enrollment objects
        """
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        #Checking if course id is present and if student has already enrolled 
        serializer = EnrollmentSerializer(
            data=request.data,
            context={"student": student}, 
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return Response(EnrollmentSerializer(enrollment).data, status=201)

class StudentUnenrolledLessons(APIView): 
    """
    TODO: change to authentication by removing student_profile_id.
    adding 
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, course_id, **kwargs):
        """
        GET method to retrieve unenrolled classrooms
        """
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        course = get_object_or_404(Course, course_id=course_id)
        unenrolled_lessons = Lesson.objects.filter(course=course).exclude(lessonenrollment__student=student).distinct()
        serializer = LessonSerializer(unenrolled_lessons, many=True, context={"request": request})
        return Response(serializer.data,  status=status.HTTP_200_OK)
    
    def post(self, request):
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        course_id = request.data.get("course_id")
        lesson_id = request.data.get("lesson_id")
        course = get_object_or_404(Course, course_id=course_id)
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id, course=course)

        ser = LessonEnrollmentSerializer(
            data={"lesson_id": lesson.pk},
            context={"request": request, "student": student},
        )
        ser.is_valid(raise_exception=True)
        enrollment = ser.save()
        return Response(LessonEnrollmentSerializer(enrollment).data, status=201)
    
    def delete(self, request, lesson_id, classroom_id, **kwargs):
        """
        Idempotent: delete if exists; 204 even if nothing to delete.
        """
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        course = get_object_or_404(Course, course_id=course_id)
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id, course=course)
        classroom = get_object_or_404(Classroom, classroom_id=classroom_id, lesson__lesson_id=lesson_id)

        LessonEnrollment.objects.filter(student=student, lesson=lesson).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class StudentUnenrolledClassrooms(APIView): 
    """
    TODO: change to authentication by removing student_profile_id.
    adding 
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    def get(self, request, lesson_id, **kwargs):
        """
        GET method to retrieve unenrolled classrooms
        """
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        lesson = Lesson.objects.get(lesson_id = lesson_id)
        unenrolled_classrooms = Classroom.objects.filter(lesson=lesson, is_active=True).exclude(classroomenrollment__student=student).distinct()
        serializer = ClassroomSerializer(unenrolled_classrooms, many=True, context={"request": request})
        return Response(serializer.data,  status=status.HTTP_200_OK)
    
    def post(self, request, lesson_id, classroom_id):
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        # sanity: ensure the classroom belongs to the lesson in the URL
        classroom = get_object_or_404(Classroom, classroom_id=classroom_id, lesson__lesson_id=lesson_id)

        ser = ClassroomEnrollmentSerializer(
            data={"classroom_id": classroom.pk},
            context={"request": request, "student": student},
        )
        ser.is_valid(raise_exception=True)
        enrollment = ser.save()
        return Response(ClassroomEnrollmentSerializer(enrollment).data, status=201)
    
    def delete(self, request, lesson_id, classroom_id, **kwargs):
        """
        Idempotent: delete if exists; 204 even if nothing to delete.
        """
        user = self.request.user
        student = get_object_or_404(StudentProfile, user=user)
        # Optional: ensure the classroom belongs to the lesson in the URL
        classroom = get_object_or_404(Classroom, classroom_id=classroom_id, lesson__lesson_id=lesson_id)

        # Hard delete the link; returns (count, _)
        ClassroomEnrollment.objects.filter(student=student, classroom=classroom).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
"""
Shared
"""
#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]
    def get(self, request, course_id):
        course = get_object_or_404(
            Course.objects.select_related('owner_instructor')
                          .annotate(enrolled_count=Count('enrollment__student', distinct=True)),  
            course_id=course_id
        )

        lessons = Lesson.objects.filter(course=course)
        lesson_data = LessonSerializer(lessons, many=True).data

        output = {
            "course_id": course.course_id,
            "course_title": course.title,
            "course_credits": course.credits,
            "course_director": course.owner_instructor.full_name if course.owner_instructor else None,
            "course_description": course.description,
            "status": course.status,
            "enrolled_count": course.enrolled_count
        }
        return Response(output, status=status.HTTP_200_OK)
    

    