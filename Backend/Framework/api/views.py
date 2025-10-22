from contextvars import Token
import re
from urllib.parse import urlparse
from .forms import *
from copy import deepcopy
import traceback
from .utils import (_LINE_SPLIT, _split_title_second, _yield_lines, 
                    _SEPS, _FORBIDDEN, _ratio, get_course_progress, 
                    compute_lesson_progress, compute_student_singular
                    )



import logging, traceback
log = logging.getLogger(__name__)
#django 
from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login, logout 
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import IntegrityError, transaction
from django.db.models import *
from django.http import HttpResponse
from django.core.validators import URLValidator

_url_validator = URLValidator(schemes=["http", "https"])
# views.py
from itertools import chain
from django.db.models import Value, IntegerField, TimeField, CharField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

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
Helper functions
"""
def update_lesson_progress(student, lesson):
    total_assignments = LessonAssignment.objects.filter(lesson=lesson).count()
    completed_assignments = StudentAssignmentProgress.objects.filter(
    student=student, assignment__lesson=lesson, is_completed=True
    ).count()

    total_readings = LessonReading.objects.filter(lesson=lesson).count()
    completed_readings = StudentReadingProgress.objects.filter(
    student=student, reading__lesson=lesson, is_completed=True
    ).count()

    total_items = total_assignments + total_readings
    completed_items = completed_assignments + completed_readings

    progress_percent = (completed_items / total_items * 100) if total_items > 0 else 0.0
    progress_percent = round(progress_percent, 2)

    StudentLessonProgress.objects.update_or_create(
        student=student,
        lesson=lesson,
        defaults={"progress_percent": progress_percent}
    )

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
        courses =( Course.objects.filter(Q(owner_instructor=instr) | Q(lesson__designer=instr)).select_related("owner_instructor")
                          .annotate(enrolled_count=Count('enrollment__student', distinct=True))
                          .annotate(
                            tot_lessons=Count('lesson', distinct=True),
                            # distinct student count via lesson enrollments
                            sum_completed=Count(
                                'lesson__lessonenrollment',
                                filter=(
                                    Q(lesson__lessonenrollment__status='Completed')
                                ),
                                distinct=False,  # counting completions, not distinct students
                            ),
                             avg_completed = _ratio(F('sum_completed'), F('enrolled_count')),
                             avg_progress  = _ratio(_ratio(F('sum_completed'), F('enrolled_count')), F('tot_lessons')),
                             avg_percentages = ExpressionWrapper(
                                    _ratio(_ratio(F('sum_completed'), F('enrolled_count')), F('tot_lessons')) * 100.0,
                                    output_field=FloatField()
                                ),
                            )
                      )
        
        output = [{
                "course_id": course.course_id,
                "course_title": course.title,
                "course_credits": course.credits,
                "course_director": course.owner_instructor.full_name,
                "course_description": course.description,
                "status": course.status,
                "enrolled_count": course.enrolled_count,
                "avg_percentages": course.avg_percentages, 
                "avg_completed": course.avg_completed,
                "tot_lessons": course.tot_lessons
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
        
"""
Classrooms
"""
class ClassroomViews: 
    class LinkingClassroomsView(APIView):
        """
        Shows all classrooms for linking 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication] 

        def get(self, request, course_id):
            """
            GET
            Grab all linked classrooms for the course and unlinked physical classrooms.
            """
            # Classrooms with lesson classroom linked to a specific course 
            linked_rows = (
                Classroom.objects
                .filter(lessonclassroom__lesson__course__course_id=course_id)
                .values(
                    "classroom_id",
                    "location",
                    "capacity",
                )
                .distinct()
            )

            # Unlinked classrooms: alias placeholders with the SAME names used above
            unlinked_rows = (
                Classroom.objects
                .filter(lessonclassroom__isnull=True, is_online=False)
                .values(
                    "classroom_id",
                    "location",
                    "capacity",
                )
            )

            def norm(r):
                return {
                    "classroom_id": r["classroom_id"],
                    "location": r["location"],
                    "capacity": r["capacity"],
                }

            DAY_ORDER = {
                "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
                "Friday": 5, "Saturday": 6, "Sunday": 7,
            }

            def day_rank(day):  # None or unknown -> 99
                return DAY_ORDER.get(day, 99)

            try:
                data = [*map(norm, linked_rows), *map(norm, unlinked_rows)]
                # CHANGED: use .get() and fallback so missing keys don’t raise KeyError
                data.sort(key=lambda x: (
                    x.get("classroom_id"),
                    day_rank(x.get("day_of_week")),
                    x.get("time_start") or ""
                ))
                return Response(data)
            except Exception as e:
                return Response(
                    {"error": str(e), "trace": traceback.format_exc()},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        
        def post(self, request, lesson_id):
            mutable_data = deepcopy(request.data)
            mutable_data.pop("lesson_id", None)
            if "classroom_id" in mutable_data and "classroom" not in mutable_data:
                mutable_data["classroom"] = mutable_data.pop("classroom_id")
            mutable_data["lesson"] = lesson_id
            serializer = LessonClassroomSerializer(
                data=mutable_data,
                context={"request": request}  #needed for supervisor fallback
            )
            serializer.is_valid(raise_exception=True)
            lesson_classroom = serializer.save()
            return Response(LessonClassroomSerializer(lesson_classroom).data, status=201)

    class OnlineClassroomsView(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            q = Q(lesson__lesson_id=lesson_id) & Q(classroom__is_online = True)
            linked_rows = (
                LessonClassroom.active
                .filter(q)
                .select_related("classroom", "supervisor")
                .annotate(enrolled_count=Count("classroomenrollment", distinct=True))   
                .values(
                    "classroom__classroom_id",
                    "classroom__location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "supervisor__full_name",
                    "duration_minutes",
                    "classroom__capacity",
                    "enrolled_count",   
                    "classroom__zoom_link",
                    "classroom__is_online",   
                    "lesson__lesson_id",
                    "duration_weeks"                                           
                )
            )

            def norm_linked(r):
                return {
                    "classroom_id": r["classroom__classroom_id"],
                    "location": r["classroom__location"],
                    "day_of_week": r["day_of_week"],
                    "supervisor": r["supervisor__full_name"],
                    "time_start": r["time_start"].strftime("%H:%M") if r["time_start"] else None,
                    "time_end": r["time_end"].strftime("%H:%M") if r["time_end"] else None,
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["classroom__capacity"],
                    "enrolled_count": r["enrolled_count"],   
                    "is_online": r["classroom__is_online"],
                    "zoom_link": r["classroom__zoom_link"], 
                    "lesson_id": r["lesson__lesson_id"],
                    "duration_weeks": r["duration_weeks"]                      
                }
            
            DAY_ORDER = {
                "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
                "Friday": 5, "Saturday": 6, "Sunday": 7,
            }

            def day_rank(day):
                """Return numeric rank for a weekday name (None or unknown -> 99)."""
                return DAY_ORDER.get(day, 99)

            try:

                data = [*map(norm_linked, linked_rows)]
                data.sort(key=lambda x: (x["classroom_id"], day_rank(x["day_of_week"]), x["time_start"]))
                return Response(data)
            
            except Exception as e:
                return Response(
                    {"error": str(e), "trace": traceback.format_exc()},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
        

        @transaction.atomic
        def post(self, request, lesson_id):
            #classroom first 
            mutable1 = deepcopy(request.data)
            mutable1["lesson"] = lesson_id
            mutable1["is_online"] = True #Just in case
            mutable1["location"] = ""
            online_classroom = ClassroomSerializer(data=mutable1, context={"request": request})
            if not  online_classroom.is_valid():
                print("ERR:", online_classroom.errors)
                return Response(online_classroom.errors, status=400)
            online_classroom_obj = online_classroom.save()

            mutable2 = deepcopy(mutable1)
            mutable2["classroom"] = online_classroom_obj.classroom_id 
            online_lesson_classroom = LessonClassroomSerializer(data=mutable2, context={"request": request})    
            if not  online_lesson_classroom.is_valid():
                print("ERR:", online_lesson_classroom.errors)
                return Response(online_lesson_classroom.errors, status=400)
            
            online_lesson_classroom_obj = online_lesson_classroom.save()
            
            
            
            return Response(
                {
                    "online_lesson_classroom": LessonClassroomSerializer(online_lesson_classroom_obj).data,
                    "online_classroom": ClassroomSerializer(online_classroom_obj).data,
                },
                status=status.HTTP_201_CREATED,
            )

    class ActiveClassroomsView(APIView):
        """
        Showing classrooms or multiple linked classrooms with self as supervisor 
        Both online and physical 
        lesson_id given: shows only classrooms linked to that lesson 
        course_id given: shows only classrooms linked to the lessons in this course
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request):
            lesson_id = request.query_params.get("lesson_id", None)
            course_id = request.query_params.get("course_id", None)

            if lesson_id is not None:
                q = Q(lesson__lesson_id=lesson_id)
            elif course_id is not None:
                q = Q(lesson__course__course_id=course_id)
            else:
                return Response({"detail": "Provide lesson_id or course_id."}, status=400)
        

            linked_rows = (
                LessonClassroom.active
                .filter(q)
                .select_related("classroom")
                .annotate(enrolled_count=Count("classroomenrollment", distinct=True))   
                .values(
                    "classroom__classroom_id",
                    "classroom__location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "supervisor__full_name",
                    "duration_minutes",
                    "classroom__capacity",
                    "enrolled_count",   
                    "classroom__zoom_link",
                    "classroom__is_online",   
                    "lesson__lesson_id",  
                    "duration_weeks",
                    "lesson_classroom_id"                                        
                )
            )

            def norm_linked(r):
                return {
                    "classroom_id": r["classroom__classroom_id"],
                    "location": r["classroom__location"],
                    "day_of_week": r["day_of_week"],
                    "supervisor": r["supervisor__full_name"],
                    "time_start": r["time_start"].strftime("%H:%M") if r["time_start"] else None,
                    "time_end": r["time_end"].strftime("%H:%M") if r["time_end"] else None,
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["classroom__capacity"],
                    "enrolled_count": r["enrolled_count"],   
                    "is_online": r["classroom__is_online"],
                    "zoom_link": r["classroom__zoom_link"], 
                    "lesson_id": r["lesson__lesson_id"],     
                    "duration_weeks": r["duration_weeks"],
                    "lesson_classroom_id"   : r["lesson_classroom_id"   ]          
                }
            
            DAY_ORDER = {
                "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
                "Friday": 5, "Saturday": 6, "Sunday": 7,
            }

            def day_rank(day):
                """Return numeric rank for a weekday name (None or unknown -> 99)."""
                return DAY_ORDER.get(day, 99)
            try:
                data = [*map(norm_linked, linked_rows)]
                data.sort(key=lambda x: (x["classroom_id"], day_rank(x["day_of_week"]), x["time_start"]))
                return Response(data)
            
            except Exception as e:
                return Response(
                    {"error": str(e), "trace": traceback.format_exc()},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

    class OwnClassroomsView(APIView):
        """
        Showing own classrooms (as supervisor) and unlinked classrooms 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request):
            """
            GET Method 
            Returns a flat list. Classrooms without links show LC fields as null.
            Classrooms with links appear once per LessonClassroom.
            Used to show own and unlinked classrooms u
            """
            
            instructor = InstructorProfile.objects.get(user=request.user)

            linked_rows = (
                LessonClassroom.active
                .filter(supervisor=instructor)
                .select_related("classroom")
                .annotate(enrolled_count=Count("classroomenrollment", distinct=True))   
                .values(
                    "classroom__classroom_id",
                    "classroom__location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "duration_minutes",
                    "classroom__capacity",
                    "enrolled_count", 
                    "supervisor__full_name",
                    "classroom__zoom_link",
                    "classroom__is_online",
                    "lesson__lesson_id"                                           
                )
            )

            unlinked_rows = (
                Classroom.objects
                .filter(Q(lessonclassroom__supervisor=instructor) | Q(lessonclassroom__isnull=True))
                .annotate(
                    day_of_week=Value(None, output_field=CharField()),
                    time_start=Value(None, output_field=TimeField()),
                    time_end=Value(None, output_field=TimeField()),
                    duration_minutes=Value(None, output_field=IntegerField()),
                    enrolled_count=Value(0, output_field=IntegerField()),              
                )
                .values(
                    "classroom_id",
                    "location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "duration_minutes",
                    "capacity",
                    "enrolled_count",
                    "lessonclassroom__supervisor__full_name",      
                    "zoom_link",
                    "is_online",
                    "lessonclassroom__lesson__lesson_id"                                          
                )
            )

            def norm_linked(r):
                return {
                    "is_supervised": True,
                    "classroom_id": r["classroom__classroom_id"],
                    "location": r["classroom__location"],
                    "day_of_week": r["day_of_week"],
                    "time_start": r["time_start"].strftime("%H:%M") if r["time_start"] else None,
                    "time_end": r["time_end"].strftime("%H:%M") if r["time_end"] else None,
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["classroom__capacity"],
                    "enrolled_count": r["enrolled_count"], 
                    "supervisor": r["supervisor__full_name"],
                    "is_online": r["classroom__is_online"],
                    "zoom_link": r["classroom__zoom_link"],
                    "lesson_id": r["lesson__lesson_id"]  
                                        
                }

            def norm_unlinked(r):
                return {
                    "is_supervised": False,
                    "classroom_id": r["classroom_id"],
                    "location": r["location"],
                    "day_of_week": r["day_of_week"],
                    "time_start": r["time_start"],
                    "time_end": r["time_end"],
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["capacity"],
                    "enrolled_count": r["enrolled_count"],    
                    "supervisor": r["lessonclassroom__supervisor__full_name"],
                    "is_online": r["is_online"],
                    "zoom_link": r["zoom_link"],
                    "lesson_id": r["lessonclassroom__lesson__lesson_id"]                           
                }

            data = [*map(norm_linked, linked_rows), *map(norm_unlinked, unlinked_rows)]
            data.sort(
                key=lambda x: (
                    x.get("is_supervised", False) is False,
                    str(x["classroom_id"]) if x["classroom_id"] is not None else 0,
                    str(x["day_of_week"]) if x["day_of_week"] else "ZZZ",
                    str(x["time_start"]) if x["time_start"] else ""
                    )
            )
            print(data)
            return Response(data)

    class CreateClassroomView(APIView):
        """
        Creating online classrooms 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def post(self, request):
            """
            POST method 
            """
            #Creating physical classrooms 
            serializer = ClassroomSerializer(
                data = request.data, 
            )
            serializer.is_valid(raise_exception=True)
            classroom = serializer.save()
            return Response(ClassroomSerializer(classroom).data, status=201)
            
"""
Lessons 
"""
class LessonViews: 
    @method_decorator(csrf_exempt, name='dispatch')
    class LessonsView(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication] 
        def get(self, request, course_id):
            """
            GET method. Retrieving Lessons related to self, or all lessons if is course director
            """
            course = get_object_or_404(Course, course_id=course_id)
            user = self.request.user
            inst = get_object_or_404(InstructorProfile, user=user)

            lessons = (
                Lesson.objects
                .filter(course=course)
                .filter(Q(designer=inst) | Q(course__owner_instructor=inst))
                .select_related('course', 'designer') 
                .annotate(enrolled_count=Count('lessonenrollment', distinct=True))
                .order_by('pk')  # or any stable ordering
                .distinct()
            )

            data = LessonSerializer(lessons, many=True).data
            return Response(data)
        
        def patch(self, request, lesson_id):
            """
            Update only changed parts
            """
            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
            ser = LessonSerializer(lesson, data=request.data, partial=True, context={"request": request})
            if not  ser.is_valid():
                return Response(ser.errors, status=400)
            try:
                ser.save()   
            except ValidationError as e:
                return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

            return Response(ser.data, status=status.HTTP_200_OK)
        
    class LessonDetails(APIView): 
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication] 
        def get(self, request, lesson_id):
            """
            GET method. Retrieving Lessons
            """
            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
            output = {
                "lesson_id": lesson.lesson_id,
                "title": lesson.title,
                "credits": lesson.credits,
                "estimated_effort": lesson.estimated_effort,
                "description": lesson.description,
                "objectives": lesson.objectives, 
                "duration_weeks":lesson.duration_weeks,
                "status": lesson.status,
                "created_by": lesson.created_by.full_name,
                "designer": lesson.designer.full_name,
                "designer_email":lesson.designer.user.email
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
                        designer = inst,
                        created_by=inst,
                        created_at=now,
                    ))

                    existing_ids.append(candidate)
                    used_numbers.add(next_n)
                    next_n += 1

                created = Lesson.objects.bulk_create(new_lessons, batch_size=100)

            out = LessonSerializer(created, many=True).data
            return Response({"created": out, "count": len(out)}, status=status.HTTP_201_CREATED)

    class LessonPrereqBulkCreateView(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            """
            List current prerequisites for a lesson.
            """
            edges = (
                LessonPrerequisite.objects
                .filter(lesson_id=lesson_id)
                .select_related("prereq_lesson")
            )
            data = LessonPrereqOutSerializer(edges, many=True).data
            return Response({"lesson_id": lesson_id, "count": len(data), "prerequisites": data})

        @transaction.atomic
        def post(self, request, lesson_id):
            ser = PrereqInputSerializer(
                data=request.data,
                context={"request": request, "lesson_id": lesson_id}
            )
            if not ser.is_valid():
                print("SERIALIZER ERRORS:", ser.errors)      # <-- see exact keys & messages
                return Response({"errors": ser.errors}, status=400)
            
            lesson = ser.validated_data["lesson"]
            prereq_list = ser.validated_data["prereq_list"]  # list[Lesson]
            mode = ser.validated_data["mode"]

            # Desired set
            desired_ids = {p.lesson_id for p in prereq_list}

            if mode == "replace":
                # Delete prerequisites not in the new list (handles empty desired_ids = clear-all)
                LessonPrerequisite.objects.filter(
                    lesson=lesson
                ).exclude(
                    prereq_lesson__lesson_id__in=desired_ids
                ).delete()


            # Recompute existing after possible deletes
            existing_prereq_ids = set(
                LessonPrerequisite.objects
                .filter(lesson=lesson)
                .values_list("prereq_lesson__lesson_id", flat=True)
            )

            # Create only missing edges
            missing_ids = desired_ids - existing_prereq_ids
            if missing_ids:
                id_to_obj = {p.lesson_id: p for p in prereq_list}
                to_create = [LessonPrerequisite(lesson=lesson, prereq_lesson=id_to_obj[lid]) for lid in missing_ids]
                # If you have a UniqueConstraint, you can optionally tolerate races:
                # LessonPrerequisite.objects.bulk_create(to_create, batch_size=100, ignore_conflicts=True)
                LessonPrerequisite.objects.bulk_create(to_create, batch_size=100)

            # Return stable, ordered list
            current_prereqs = (
                LessonPrerequisite.objects
                .filter(lesson=lesson)
                .select_related("prereq_lesson")
                .order_by("prereq_lesson__lesson_id")
            )
            out = LessonPrereqOutSerializer(current_prereqs, many=True).data

            # Optional: choose 200 vs 201 based on whether we created anything.
            return Response(
                {"lesson_id": lesson.lesson_id, "prerequisites": out, "count": len(out)},
                status=status.HTTP_201_CREATED
            )

    
    class LessonReadingBulkCreateView(APIView):
        """
        POST body:
        { "items": "Title | https://a\nOnly a Title\nhttps://b\nTitle - https://c",
            "mode": "merge" | "replace" }
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
            qs = LessonReading.objects.filter(lesson=lesson).order_by("-created_at", "-pk")
            serializer = LessonReadingSerializer(qs, many=True)
            return Response(serializer.data)

        def _validate_item(self, title: str, url: str):
            t = (title or "").strip()
            u = (url or "").strip()

            if not t:
                raise serializers.ValidationError({"title": "Title cannot be empty."})

            if any(ch in t for ch in _FORBIDDEN):
                raise serializers.ValidationError({"title": "Title must not contain '|'."})

            if u:
                try:
                    _url_validator(u)  # your existing validator
                except ValidationError:
                    raise serializers.ValidationError({"url": f"Invalid URL: {u}"})

            return t, u

        @transaction.atomic
        def post(self, request, lesson_id):
            # Envelope
            print("data", request.data)
            ser = LessonItemsBulkSerializer(data=request.data)
            ser.is_valid(raise_exception=True)
            items = ser.validated_data["items"]
            mode  = ser.validated_data["mode"]
            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
            print(items)

            if items == "":
                return Response({"lesson_id": ["This field is required."]}, status=400)

            # Existing rows scoped to THIS lesson
            existing = list(LessonReading.objects.filter(lesson=lesson))
            by_title = {o.title: o for o in existing}
            by_url   = {(o.url or "").strip(): o for o in existing if (o.url or "").strip()}

            # ---- Parse + VALIDATE ALL LINES, ACCUMULATE ERRORS ----
            parsed = []
            errors = []
            raw_lines = list(_yield_lines(items))  

            for idx, line in enumerate(raw_lines, start=1):
                try:
                    title, url = _split_title_second(line)
                    t, u = self._validate_item(title, url)
                    parsed.append((t, u))
                except serializers.ValidationError as e:
                    errors.append({"line": idx, "content": line, "error": e.detail})
                except Exception as e:
                    errors.append({"line": idx, "content": line, "error": f"Unexpected: {str(e)}"})

            if errors:
                # print everything for your console/logs
                print("DEBUG: Validation errors detected:")
                for err in errors:
                    print(err)
                return Response(
                    {"message": "One or more items failed validation", "errors": errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            incoming_titles = {t for (t, _) in parsed}
            saved = []

            # ---- Upsert loop ----
            for t, u in parsed:
                u = (u or "").strip()

                if t in by_title:
                    obj = by_title[t]
                    if u != "" and obj.url != u:
                        obj.url = u
                        obj.save(update_fields=["url"])
                    saved.append(obj)
                    continue

                if u != "" and u in by_url:
                    old = by_url[u]
                    if old.title != t:
                        old.delete()
                    obj = LessonReading.objects.create(lesson=lesson, title=t, url=u)
                    saved.append(obj)
                    # keep maps consistent
                    by_title[t] = obj
                    by_url[u] = obj
                    continue

                obj = LessonReading.objects.create(lesson=lesson, title=t, url=u or "")
                saved.append(obj)
                by_title[t] = obj
                if u:
                    by_url[u] = obj

            # ---- Replace only within this lesson ----
            deleted_count = 0
            if mode == "replace":
                qs_del = LessonReading.objects.filter(lesson=lesson).exclude(title__in=incoming_titles)
                deleted_count = qs_del.count()
                qs_del.delete()

            return Response(
                {
                    "saved": LessonReadingSerializer(saved, many=True).data,
                    "mode": mode,
                    "deleted_count": deleted_count,
                },
                status=status.HTTP_201_CREATED,
            )
        
    class LessonAssignmentBulkCreateView(APIView):
        """
        GET  /instructor/lessons/<lesson_id>/assignments/
        POST /instructor/lessons/<lesson_id>/assignments/   (body: { items, mode[, lesson_id?] })

        items: newline-separated lines
        - "Title | Description"
        - "Only a Title"
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
            qs = (LessonAssignment.objects
                .filter(lesson=lesson)
                .order_by("-created_at", "-pk")
                .values("assignment_id", "title", "description", "created_at", "updated_at"))
            return Response(list(qs), status=status.HTTP_200_OK)

        def _validate_item(self, title: str, desc: str):
            t = (title or "").strip()
            d = (desc or "").strip()
            
            if not t:
                raise serializers.ValidationError({"title": "Title cannot be empty."})

            if any(ch in t for ch in _FORBIDDEN):
                raise serializers.ValidationError({"title": "Title must not contain '|'."})

            if d and any(ch in d for ch in _FORBIDDEN):
                raise serializers.ValidationError({"description": "Description must not contain '|'."})

            return t, d

        @transaction.atomic
        def post(self, request, lesson_id):
            # Envelope
            print("data", request.data)
            ser = LessonItemsBulkSerializer(data=request.data)
            if not ser.is_valid():
                print("SERIALIZER ERRORS:", ser.errors)      # <-- see exact keys & messages
                return Response({"errors": ser.errors}, status=400)
            body_lesson = (ser.validated_data.get("lesson_id") or "").strip()

            if body_lesson and body_lesson != lesson_id:
                return Response(
                    {"lesson_id": ["Body lesson_id does not match URL path."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
            items = ser.validated_data["items"]
            mode  = ser.validated_data["mode"]  # "merge" or "replace"

            # Preload existing for THIS lesson only
            existing = list(LessonAssignment.objects.filter(lesson=lesson))
            by_title = {o.title: o for o in existing}
            by_desc  = {(o.description or "").strip(): o
                        for o in existing if (o.description or "").strip()}

            # Parse all lines and COLLECT ALL ERRORS
            parsed = []
            errors = []
            raw_lines = list(_yield_lines(items))
            for idx, line in enumerate(raw_lines, start=1):
                try:
                    title, desc = _split_title_second(line)
                    t, d = self._validate_item(title, desc)
                    parsed.append((t, d))
                except serializers.ValidationError as e:
                    errors.append({"line": idx, "content": line, "error": e.detail})
                except Exception as e:
                    errors.append({"line": idx, "content": line, "error": f"Unexpected: {str(e)}"})

            if errors:
                # You can also print(errors) here while debugging
                return Response(
                    {"message": "One or more items failed validation", "errors": errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            incoming_titles = {t for (t, _) in parsed}
            saved = []

            # Upsert logic (using DESCRIPTION, not url)
            for t, d in parsed:
                d = (d or "").strip()
                print("t", t, "d", d)
                if t in by_title:
                    # same title → update description ONLY if provided (non-empty)
                    obj = by_title[t]
                    if d != "" and obj.description != d:
                        obj.description = d
                        obj.save(update_fields=["description"])
                    saved.append(obj)
                    continue

                if d != "" and d in by_desc:
                    # SAME DESCRIPTION, NEW TITLE → DISCARD old and CREATE new
                    old = by_desc[d]
                    if old.title != t:
                        old.delete()
                    obj = LessonAssignment.objects.create(lesson=lesson, title=t, description=d)
                    saved.append(obj)
                    # keep maps consistent if later lines refer to them
                    by_title[t] = obj
                    by_desc[d]  = obj
                    continue

                # brand new
                obj = LessonAssignment.objects.create(lesson=lesson, title=t, description=d or "")
                saved.append(obj)
                by_title[t] = obj
                if d:
                    by_desc[d] = obj

            # replace mode: ONLY within this lesson
            deleted_count = 0
            if mode == "replace":
                qs_del = LessonAssignment.objects.filter(lesson=lesson).exclude(title__in=incoming_titles)
                deleted_count = qs_del.count()
                qs_del.delete()
            
            print("URL lesson_id:", lesson_id, "Body lesson_id:", body_lesson)
            print("RAW lines:", list(_yield_lines(items)))
            print("Existing titles:", list(by_title.keys()))

            return Response(
                {
                    "saved": LessonAssignmentSerializer(saved, many=True).data,
                    "mode": mode,
                    "deleted_count": deleted_count,
                },
                status=status.HTTP_201_CREATED,
            )
    class AssignmentTextView(APIView):
        """
        Return all assignments in a plain text format:
        "title | description" per line.
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            print("id", lesson_id)
            # 1. Query all assignments
            assignments = LessonAssignment.objects.filter(lesson__lesson_id = lesson_id).values("title", "description")
            # 2. Build each line as "title | description"
            lines = []
            for a in assignments:
                title = a.get("title", "").strip()
                desc = a.get("description", "").strip()
                lines.append(f"{title} | {desc}")

            # 3. Join by newline
            output_text = "\n".join(lines)
            
            # 4. Return as plain text (or JSON if you prefer)
            return Response({"assignments_text": output_text})

    class ReadingTextView(APIView):
        """
        Return all assignments in a plain text format:
        "title | description" per line.
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]


        def get(self, request, lesson_id):
            # 1. Query all assignments
            readings = LessonReading.objects.filter(lesson__lesson_id = lesson_id).values("title", "url")
            
            # 2. Build each line as "title | description"
            lines = []
            for a in readings:
                title = a.get("title", "").strip()
                desc = a.get("url", "").strip()
                lines.append(f"{title} | {desc}")

            # 3. Join by newline
            output_text = "\n".join(lines)

            # 4. Return as plain text (or JSON if you prefer)
            return Response({"readings_text": output_text})

    class PrereqsTextView(APIView):
        """
        Return all prerequisites of a lesson as plain text.
        Example output: "LES001, LES002, LES003"
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            # 1. Query prerequisites for this lesson
            prereqs = (
                LessonPrerequisite.objects
                .filter(lesson__lesson_id=lesson_id)
                .values_list("prereq_lesson__lesson_id", flat=True)  # fetch related lesson_id directly
            )
            
            # 2. Convert to comma-separated string
            output_text = ", ".join(prereqs)
            print("prereqs", output_text)

            # 3. Return as JSON so frontend can use it easily
            return Response({"prereqs_text": output_text})
        
"""
See student list / progress 
"""

class ProgressView: 
    class InstructorCourseProgress(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self,request, course_id):
            """
            GET method to get:
                - List of lessons with data summaries
                - List of students with data summaries  
            """
            try:
                data = get_course_progress(self.request.user, course_id)
                print("course", data)
                return Response(data, status=status.HTTP_200_OK)
            except Exception as e:
                print(str(e))
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

    class InstructorLessonProgress(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]
        
        def get(self, request, lesson_id):
            try:
                data = compute_lesson_progress(request.user, lesson_id, include_students=True)
                print("lesson_data", data)
                return Response(data, status=200)
            except Http404 as e:
                return Response({"detail": str(e)}, status=404)
            except PermissionDenied as e:
                return Response({"detail": str(e)}, status=403)
            except Exception as e:
                log.error("Lesson progress error: %s\n%s", e, traceback.format_exc())
                return Response({"detail": "Server error while computing progress."}, status=500)

    class InstructorStudentProgress(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]
        def get(self, request, student_profile_id):
            course_id = request.query_params.get("course_id")  # may be None
            try:
                data = compute_student_singular(
                    student_profile_id,
                    course_id=course_id,
                    session_source="per_student"
                )
                print("student", data)
                return Response(data, status=200)

            except Http404 as e:
                return Response({"detail": str(e)}, status=404)

            except PermissionDenied as e:
                return Response({"detail": str(e)}, status=403)

            except ValidationError as e:
                # DRF ValidationError should be a 400 with a clear payload
                return Response({"detail": str(e.detail)}, status=400)

            except Exception as e:
                # Don’t hide real bugs as 400s
                log.error("Student progress error: %s\n%s", e, traceback.format_exc())
                return Response({"detail": "Server error while computing student progress."}, status=500)


class EnrolledStudentList(APIView):
    """
    GET /api/students/enrolled?course_id=...&lesson_id=...&classroom_id=...&q=...&ordering=full_name
    - Provide any combination of course_id, lesson_id, classroom_id.
    - If multiple are provided, the result is the INTERSECTION (i.e., students satisfying all filters).
    - Optional 'ordering' (e.g., 'last_name', '-last_name', 'student_no').
    - Uses simple page params: page (1-based), page_size (default 25).

    Show all students in a course/lesson/classroom

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
        qs = StudentProfile.objects.all().annotate(
            email = F("user__email")
            )
        # Apply filters (intersection semantics)
        if course:
            qs = qs.filter(enrollment__course=course)
        if lesson:
            qs = qs.filter(lessonenrollment__lesson=lesson)
        if classroom:
            qs = qs.filter(classroomenrollment__classroom=classroom)
        qs = qs.order_by('last_name').distinct()

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
            "students": ser.data
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

class StudentProfileView(APIView): 
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication] 
    
    def get(self, request): 
        user = self.request.user 
        me = get_object_or_404(StudentProfile, user=user)
        return Response(StudentSerializer(me).data, status=200)

class StudentEnrolledViews: 
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

    class StudentEnrolledLessons(APIView):
        """
        See enrolled lessons 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication] 
        
        def get(self, request, course_id):
            user = self.request.user
            student = get_object_or_404(StudentProfile, user=user)
            lessons = (Lesson.objects
                    .filter(lessonenrollment__student=student, course__course_id=course_id)
                    .select_related("course", "designer") 
                    .distinct() )
            output = [{
                    "lesson_id": lesson.lesson_id,
                    "lesson_title": lesson.title,
                    "lesson_description": lesson.description,
                    "lesson_designer": lesson.designer.full_name,
                    "lesson_credits": lesson.credits,
                    "lesson_duration": lesson.duration_weeks,
                    "course_id": lesson.course.course_id,
                    "course_title": lesson.course.title,
                    }
                    for lesson in lessons]
            return Response(output, status=status.HTTP_200_OK)

    class StudentEnrolledClassrooms(APIView): 
        """
        Show currently enrolled classroom and unenroll 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication] 
        
        def get(self, request, lesson_id):
            student = get_object_or_404(StudentProfile, user=request.user)
            linked_rows = (
                LessonClassroom.active
                .filter(lesson__lesson_id=lesson_id, classroomenrollment__student=student, classroom__is_active=True)
                .select_related("classroom")
                .annotate(enrolled_count=Count("classroomenrollment", distinct=True))   
                .values(
                    "classroom__classroom_id",
                    "classroom__location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "duration_minutes",
                    "classroom__capacity",
                    "enrolled_count",   
                    "classroom__zoom_link"                                               
                )
            )


            def norm_linked(r):
                return {
                    "classroom_id": r["classroom__classroom_id"],
                    "location": r["classroom__location"],
                    "day_of_week": r["day_of_week"],
                    "time_start": r["time_start"].strftime("%H:%M") if r["time_start"] else None,
                    "time_end": r["time_end"].strftime("%H:%M") if r["time_end"] else None,
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["classroom__capacity"],
                    "enrolled_count": r["enrolled_count"], 
                    "zoom_link": r["classroom__zoom_link"] 
                                               
                }
            data = [*map(norm_linked, linked_rows)]
            data.sort(key=lambda x: (x["classroom_id"], x["day_of_week"] or 99, x["time_start"] or ""))
            print("selected classroom:", data)
            
            return Response(data)
        def delete(self, request, lesson_id, classroom_id, **kwargs):
            student = get_object_or_404(StudentProfile, user=request.user)

            lc = get_object_or_404(
                LessonClassroom,
                lesson__lesson_id=lesson_id,
                classroom__classroom_id=classroom_id,
            )

            ClassroomEnrollment.objects.filter(student=student, lesson_classroom=lc).delete()
            return Response(status=204)

    class StudentEnroll(APIView):
        """
        Enrolling in courses
        """
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

class StudentUnenrolledViews:
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
            unenrolled_lessons = Lesson.objects.filter(
                Q(course=course) &  Q(status="Active")
                ).exclude(Q(lessonenrollment__student=student)).distinct()
            serializer = LessonSerializer(unenrolled_lessons, many=True, context={"request": request})
            return Response(serializer.data,  status=status.HTTP_200_OK)
        
        def post(self, request, course_id, **kwargs):
            user = self.request.user
            student = get_object_or_404(StudentProfile, user=user)
            lesson_id = request.data.get("lesson_id")

            if not lesson_id:
                return Response({"lesson_id": ["This field is required."]}, status=400)


            ser = LessonEnrollmentSerializer(
                 data={"lesson_id": lesson_id},     # <-- match the serializer field name
                 context={"student": student},
            )

            # Debug prints
            print("CONTENT-TYPE:", request.content_type)
            print("REQUEST.DATA:", dict(request.data))
            print("lesson_id (input):", lesson_id)
            
            if not ser.is_valid():
                print("SERIALIZER ERRORS:", ser.errors)
                   # <-- see exact keys & messages
                return Response({"errors": ser.errors}, status=400)
            try:
                obj = ser.save()
            except ValidationError as e:
                print("error in validation")
                return Response(e.message_dict, status=400)
            print("error in validation")
            return Response(LessonEnrollmentSerializer(obj).data, status=201)
        
        def delete(self, request, lesson_id, classroom_id, course_id, **kwargs):
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
        Show currently unenrolled classrooms and enroll 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            student = get_object_or_404(StudentProfile, user=request.user)

            qs = (
                LessonClassroom.active
                .filter(lesson__lesson_id=lesson_id)
                .exclude(classroomenrollment__student=student)
                .select_related("classroom")
                .annotate(enrolled_count=Count("classroomenrollment", distinct=True))   
                .values(
                    "classroom__classroom_id",
                    "classroom__location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "duration_minutes",
                    "classroom__capacity",
                    "enrolled_count",   
                    "supervisor__full_name",
                    "classroom__zoom_link"                                              
                )
            )

            def norm(r):
                return {
                    "classroom_id": r["classroom__classroom_id"],
                    "location": r["classroom__location"],
                    "day_of_week": r["day_of_week"],
                    "time_start": r["time_start"].strftime("%H:%M") if r["time_start"] else None,
                    "time_end": r["time_end"].strftime("%H:%M") if r["time_end"] else None,
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["classroom__capacity"],
                    "enrolled_count": r["enrolled_count"], 
                    "supervisor" : r["supervisor__full_name"],
                    "zoom_link" : r["classroom__zoom_link"]                           
                }

            data = [*map(norm, qs)]
            data.sort(key=lambda x: (x["classroom_id"], x["day_of_week"] or 99, x["time_start"] or ""))
            print("data", data)
            
            return Response(data, status=200)
        
        def post(self, request, lesson_id, classroom_id):
            student = get_object_or_404(StudentProfile, user=request.user)
            print("enrolling")
            # ensure this classroom belongs to the lesson
            lc = get_object_or_404(
                LessonClassroom,
                lesson__lesson_id=lesson_id,
                classroom__classroom_id=classroom_id,
            )

            # prevent duplicates if needed
            exists = ClassroomEnrollment.objects.filter(student=student, lesson_classroom=lc).exists()
            if exists:
                return Response({"detail": "Already enrolled in this classroom."}, status=200)

            enrollment = ClassroomEnrollment.objects.create(student=student, lesson_classroom=lc)
            return Response({"ok": True, "classroom_id": classroom_id}, status=201)

    class StudentLessonDetails(APIView):
        """
        View lesson details and classrooms 
        """
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]

        def get(self, request, lesson_id):
            # 1) Student
            student = get_object_or_404(
                StudentProfile.objects.select_related("user"),
                user=request.user
            )

            # 2) Lesson (public portion)
            lesson = get_object_or_404(
                Lesson.objects.select_related("course", "designer"),
                lesson_id=lesson_id
            )

            # 3) Enrollment for THIS lesson (soft check)
            enrollment = (
                LessonEnrollment.objects
                .filter(student=student, lesson=lesson)
                .first()
            )

            # 4) Chosen classroom (if any) for THIS lesson
            chosen = None
            if enrollment:
                ce = (
                    ClassroomEnrollment.objects
                    .filter(student=student, lesson_classroom__lesson=lesson)
                    .select_related("lesson_classroom__classroom")
                    # Count how many enrollments exist for THIS LessonClassroom
                    # NOTE: if your related_name is different, replace "classroomenrollment" below.
                    .annotate(enrolled_count=Count("lesson_classroom__classroomenrollment", distinct=True))
                    .order_by("-id")  # TODO: prefer "-updated_at" or filter(current=True)
                    .first()
                )
                if ce:
                    lc = ce.lesson_classroom

                    def fmt_time(t):
                        return t.strftime("%H:%M") if t else None

                    chosen = {
                        "classroom_id": lc.classroom.classroom_id,
                        "location": lc.classroom.location,
                        "day_of_week": lc.day_of_week,
                        "time_start": fmt_time(lc.time_start),
                        "time_end": fmt_time(lc.time_end),
                        "duration_minutes": lc.duration_minutes,
                        "capacity": getattr(lc.classroom, "capacity", None),  
                        "enrolled_count": ce.enrolled_count,
                        "zoom_link": ce.lesson_classroom.classroom.zoom_link                  
                    }

            # 5) Designer name (safe)
            dn = getattr(lesson.designer, "full_name", None)
            if not dn and getattr(lesson.designer, "first_name", None) or getattr(lesson.designer, "last_name", None):
                dn = f"{getattr(lesson.designer, 'first_name', '')} {getattr(lesson.designer, 'last_name', '')}".strip() or None

            output = {
                "lesson_id": lesson.lesson_id,
                "title": lesson.title,
                "description": lesson.description,
                "designer": dn,
                "objectives": lesson.objectives,
                "credits": lesson.credits,
                "duration_weeks": lesson.duration_weeks,
                "course_id": lesson.course.course_id,
                "course_title": lesson.course.title,
                "is_enrolled": bool(enrollment),
                "chosen_classroom": chosen,  # null if none
            }
            return Response(output, status=status.HTTP_200_OK) 
        

import logging
from django.http import HttpResponseServerError
logger = logging.getLogger(__name__)
class StudentClassrooms(APIView):
     permission_classes = [IsAuthenticated]
     authentication_classes = [CustomJWTAuthentication]
     def get(self, request):
         user = self.request.user
         student = get_object_or_404(StudentProfile, user=user)
         q = Q(classroomenrollment__student=student)
         linked_rows = (
                LessonClassroom.active
                .filter(q)
                .select_related("classroom")
                .annotate(enrolled_count=Count("classroomenrollment", distinct=True))   
                .values(
                    "lesson__lesson_id",
                    "lesson__title",
                    "lesson__course__course_id",
                    "lesson__course__title",
                    "classroom__classroom_id",
                    "classroom__location",
                    "day_of_week",
                    "time_start",
                    "time_end",
                    "supervisor__full_name",
                    "duration_minutes",
                    "classroom__capacity",
                    "enrolled_count",   
                    "classroom__zoom_link",
                    "classroom__is_online",   
                    "lesson__lesson_id",  
                    "duration_weeks",
                    "lesson_classroom_id"                                        
                )
            )
         def norm_linked(r):
                return {
                    "lesson_id":r["lesson__lesson_id"],
                    "lesson_title":r["lesson__title"],
                    "course_id": r["lesson__course__course_id"],
                    "course_title": r["lesson__course__title"],
                    "classroom_id": r["classroom__classroom_id"],
                    "location": r["classroom__location"],
                    "day_of_week": r["day_of_week"],
                    "supervisor": r["supervisor__full_name"],
                    "time_start": r["time_start"].strftime("%H:%M") if r["time_start"] else None,
                    "time_end": r["time_end"].strftime("%H:%M") if r["time_end"] else None,
                    "duration_minutes": r["duration_minutes"],
                    "capacity": r["classroom__capacity"],
                    "enrolled_count": r["enrolled_count"],   
                    "is_online": r["classroom__is_online"],
                    "zoom_link": r["classroom__zoom_link"], 
                    "lesson_id": r["lesson__lesson_id"],     
                    "duration_weeks": r["duration_weeks"],
                    "lesson_classroom_id"   : r["lesson_classroom_id"   ]          
                }
            
         DAY_ORDER = {
                "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
                "Friday": 5, "Saturday": 6, "Sunday": 7,
            }

         def day_rank(day):
                """Return numeric rank for a weekday name (None or unknown -> 99)."""
                return DAY_ORDER.get(day, 99)
         try:
                data = [*map(norm_linked, linked_rows)]
                data.sort(key=lambda x: (x["classroom_id"], day_rank(x["day_of_week"]), x["time_start"]))
                print(data)
                return Response(data)
         except Exception as e:
            # Log the full traceback to the console explicitly
            logger.exception("Error in student_classrooms_viewing") 
            # You can even return the error message directly to the user for testing (temporarily)
            return HttpResponseServerError(f"Debugging Error: {e.__class__.__name__}: {e}")


"""
Shared
"""
#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, course_id):
        completed = LessonEnrollment.EnrollmentStatus.COMPLETED
        course = get_object_or_404(
            Course.objects.select_related('owner_instructor')
                          .annotate(enrolled_count=Count('enrollment__student', distinct=True))
                          .annotate(
                            tot_lessons=Count('lesson', distinct=True),
                            # distinct student count via lesson enrollments

                            # total completed lesson enrollments across the course
                            sum_completed=Count(
                                'lesson__lessonenrollment',
                                filter=(
                                    Q(lesson__lessonenrollment__status=completed)
                                ),
                                distinct=False,  # counting completions, not distinct students
                            ),
                            ) .annotate(
                                avg_completed = _ratio(F('sum_completed'), F('enrolled_count')),
                                avg_progress  = _ratio(_ratio(F('sum_completed'), F('enrolled_count')), F('tot_lessons')),
                                avg_percentages = ExpressionWrapper(
                                    _ratio(_ratio(F('sum_completed'), F('enrolled_count')), F('tot_lessons')) * 100.0,
                                    output_field=FloatField()
                                ),
                            )
                            
                             ,  
            course_id=course_id
        )
        output = {
            "course_id": course.course_id,
            "course_title": course.title,
            "course_credits": course.credits,
            "course_director": course.owner_instructor.full_name if course.owner_instructor else None,
            "course_description": course.description,
            "status": course.status,
            "enrolled_count": course.enrolled_count,
            "tot_lessons":course.tot_lessons,
            "avg_completed": course.avg_completed, 
            "avg_progress": course.avg_progress,
            "avg_percentages": course.avg_percentages
        }

        return Response(output, status=status.HTTP_200_OK)

class AdminView:
    class AdminLogin(APIView): 
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

            admin = (
                AdminProfile.objects
                .select_related("user")
                .filter(user=user)
                .first()
            )
            if not admin:
                # Auth succeeded, but user lacks instructor privileges
                return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

            
            payload = {
                "access": str(token.access_token),
                "refresh": str(token),
                "user": {
                    "admin_profile_id": admin.admin_profile_id,
                    "full_name": admin.full_name,
                    "role": "admin",
                    "email": user.email,
                    "user_id": user.user_id,
                },
            }
            return Response(payload, status=status.HTTP_200_OK)

    class AdminInstructorListView(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]
        
        def get(self, request):
            admin = AdminProfile.objects.filter(user=request.user).first()
            if not admin:
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            
            instructors = InstructorProfile.objects.select_related('user').all()
            serializer = InstructorListSerializer(instructors, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        def post(self, request):
            admin = get_object_or_404(AdminProfile, user=request.user)
            if not admin:
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            serializer = InstructorCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                instructor = serializer.save()
                return Response(
                    InstructorListSerializer(instructor).data,
                    status=status.HTTP_201_CREATED
                )

    class AdminInstructorDetailView(APIView):
        permission_classes = [IsAuthenticated]
        authentication_classes = [CustomJWTAuthentication]
        
        def get(self, request, instructor_id):
            admin = AdminProfile.objects.filter(user=request.user).first()
            if not admin:
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            
            instructor = get_object_or_404(InstructorProfile, instructor_profile_id=instructor_id)
            serializer = InstructorListSerializer(instructor)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        def patch(self, request, instructor_id):
            admin = AdminProfile.objects.filter(user=request.user).first()
            if not admin:
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            
            instructor = get_object_or_404(InstructorProfile, instructor_profile_id=instructor_id)
            
            if 'is_active' in request.data:
                instructor.user.is_active = request.data['is_active']
                instructor.user.save()
            
            for field in ['title', 'full_name']:
                if field in request.data:
                    setattr(instructor, field, request.data[field])
            
            instructor.save()
            serializer = InstructorListSerializer(instructor)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        def delete(self, request, instructor_id):
            admin = AdminProfile.objects.filter(user=request.user).first()
            if not admin:
                return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
            
            instructor = get_object_or_404(InstructorProfile, instructor_profile_id=instructor_id)
            user = instructor.user
            
            user.is_active = False
            user.save()
            
            return Response({"detail": "Instructor deactivated successfully."}, status=status.HTTP_200_OK)

class StudentAssignmentChecklistView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, lesson_id):
        student = get_object_or_404(StudentProfile, user=request.user)
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
        assignments=LessonAssignment.objects.filter(lesson=lesson)

        progress_map = {
            p.assignment.assignment_id: p.is_completed
            for p in StudentAssignmentProgress.objects.filter(student=student, assignment__lesson=lesson)
        }
        data = [
            {
                "assignment_id": a.assignment_id,
                "title": a.title,
                "description": a.description,
                "completed": progress_map.get(a.assignment_id, False),
            }
            for a in assignments
        ]
        return Response(data)

    def post(self, request, lesson_id):
        student = get_object_or_404(StudentProfile, user=request.user)
        assignment_id = request.data.get("assignment_id")
        completed = request.data.get("completed", False)

        assignment = get_object_or_404(LessonAssignment, assignment_id=assignment_id, lesson__lesson_id=lesson_id)
        progress, _ = StudentAssignmentProgress.objects.get_or_create(student=student, assignment=assignment)
        progress.is_completed = completed
        progress.save()
        
        update_lesson_progress(student, assignment.lesson)

        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)

class StudentReadingChecklistView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, lesson_id):
        student = get_object_or_404(StudentProfile, user=request.user)
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id)
        readings=LessonReading.objects.filter(lesson=lesson)

        progress_map = {
            p.reading.reading_id: p.is_completed
            for p in StudentReadingProgress.objects.filter(student=student, reading__lesson=lesson)
        }
        data = [
            {
                "reading_id": r.reading_id,
                "title": r.title,
                "url": r.url,
                "completed": progress_map.get(r.reading_id, False),
            }
            for r in readings
        ]
        return Response(data)

    def post(self, request, lesson_id):
        student = get_object_or_404(StudentProfile, user=request.user)
        reading_id = request.data.get("reading_id")
        completed = request.data.get("completed", False)

        reading = get_object_or_404(LessonReading, reading_id=reading_id, lesson__lesson_id=lesson_id)
        progress, _ = StudentReadingProgress.objects.get_or_create(student=student, reading=reading)
        progress.is_completed = completed
        progress.save()

        update_lesson_progress(student, reading.lesson)

        return Response({"message": "Updated successfully"}, status=status.HTTP_200_OK)

class StudentLessonProgressView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request, course_id, lesson_id):
        student = get_object_or_404(StudentProfile, user=request.user)
        lesson = get_object_or_404(Lesson, lesson_id=lesson_id)

        progress, _ = StudentLessonProgress.objects.get_or_create(student=student, lesson=lesson)
        return Response({
            "lesson_id": lesson.lesson_id,
            "progress_percent": progress.progress_percent
        }, status=status.HTTP_200_OK)