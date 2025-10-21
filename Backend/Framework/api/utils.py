import re
from django.db import transaction
from django.apps import apps
from django.shortcuts import get_object_or_404
from django.apps import apps
from django.db.models import (
    Count, Sum, F, Q, Value, FloatField, IntegerField, DateTimeField,
    OuterRef, Subquery, Case, When, ExpressionWrapper
)
from django.db.models.functions import Coalesce

from rest_framework import serializers
from .models import * 
from typing import Dict, Any, List


_LINE_SPLIT = re.compile(r"[\r\n]+")
_SEPS = {" | ", "|"}
_FORBIDDEN = {"|"}

def _yield_lines(block: str):
    for line in _LINE_SPLIT.split(block or ""):
        s = (line or "").strip()
        if s:
            yield s

def _split_title_second(line: str):
    title, second = line, ""
    for sep in _SEPS:
        if sep in line:
            left, right = line.split(sep, 1)
            title, second = left.strip(), right.strip()
            break
    return title, second


def mark_enrollment_complete_if_ready(enrollment_id: int) -> None:
    with transaction.atomic():
        enrollment = (
            LessonEnrollment.objects
            .select_for_update()  # avoid racing updates
            .select_related("lesson", "student")
            .get(pk=enrollment_id)
        )

        lesson = enrollment.lesson
        student = enrollment.student

        # totals for that lesson
        tot_asgns = LessonAssignment.objects.filter(lesson=lesson).count()
        tot_reads = LessonReading.objects.filter(lesson=lesson).count()

        # done by this student for that lesson
        done_asgns = StudentAssignment.objects.filter(
            student=student, lesson=lesson, is_completed=True
        ).count()

        done_reads = StudentReading.objects.filter(
            student=student, lesson=lesson, is_completed=True
        ).count()

        all_work_done = (done_asgns == tot_asgns) and (done_reads == tot_reads)

        # time condition
        duration_weeks = getattr(lesson, "duration_week", 0) or 0
        deadline = enrollment.enrolled_at + timedelta(weeks=duration_weeks)
        time_reached = timezone.now() >= deadline

        new_status = (
            LessonEnrollment.EnrollmentStatus.COMPLETED
            if (all_work_done and time_reached)
            else LessonEnrollment.EnrollmentStatus.INCOMPLETE
        )

        if enrollment.status != new_status:
            enrollment.status = new_status
            enrollment.save(update_fields=["status"])

"""
For singular lesson to look at progress of students related to it 
"""


def _safe_div(num_expr, den_expr, as_float=True):
    """Return num/den but 0 when denominator <= 0 (ORM expression)."""
    out = FloatField() if as_float else IntegerField()
    # den_expr.name is available for F() expressions
    return Case(
        When(**{f"{den_expr.name}__gt": 0}, then=num_expr / den_expr),
        default=Value(0.0 if as_float else 0),
        output_field=out,
    )

def compute_lesson_progress(
    user,
    lesson_id: str,
    *,
    include_students: bool = True,
    session_source: str = "lesson",  # "lesson" = first LessonClassroom for lesson. If you later have a per-student session link, we can add "per_student".
) -> Dict[str, Any]:
    """
    Build the 'Lesson Progress - Singular Object' payload.

    Returns:
      {
        "lesson": { ... lesson-level fields ... },
        "students": [ ... ]  # only if include_students=True
      }

    Assumptions (rename if yours differ):
      - StudentProfile has fields: student_profile_id, title, first_name, last_name, user__email
      - LessonEnrollment: (lesson, student, enrolled_at, status or is_completed)
      - LessonAssignment(lesson), LessonReading(lesson)
      - StudentAssignmentProgress(student, assignment, is_completed)
      - StudentReadingProgress(student, reading, is_completed)
      - LessonClassroom(lesson, classroom, day_of_week, time_start, time_end)
    """
    Lesson                     = apps.get_model('api', 'Lesson')
    LessonEnrollment           = apps.get_model('api', 'LessonEnrollment')
    LessonAssignment           = apps.get_model('api', 'LessonAssignment')
    LessonReading              = apps.get_model('api', 'LessonReading')
    StudentProfile             = apps.get_model('api', 'StudentProfile')
    StudentAssignmentProgress  = apps.get_model('api', 'StudentAssignmentProgress')
    StudentReadingProgress     = apps.get_model('api', 'StudentReadingProgress')
    LessonClassroom            = apps.get_model('api', 'LessonClassroom')
    InstructorProfile          = apps.get_model('api', 'InstructorProfile')

    inst = get_object_or_404(InstructorProfile, user = user)

    # ---------- LESSON-LEVEL SUBQUERIES ----------
    asgn_count_sq = (
        LessonAssignment.objects
        .filter(lesson__lesson_id=OuterRef('lesson_id'))
        .values('lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    read_count_sq = (
        LessonReading.objects
        .filter(lesson__lesson_id=OuterRef('lesson_id'))
        .values('lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    done_asgn_sq = (
        StudentAssignmentProgress.objects
        .filter(assignment__lesson__lesson_id=OuterRef('lesson_id'),
                is_completed=True)
        .values('assignment__lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    done_read_sq = (
        StudentReadingProgress.objects
        .filter(reading__lesson__lesson_id=OuterRef('lesson_id'))
        .filter(Q(is_completed=True) | Q(completed=True))
        .values('reading__lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    tot_lesson_stud_sq = (
        LessonEnrollment.objects
        .filter(lesson__lesson_id=OuterRef('lesson_id'))
        .values('lesson__lesson_id')
        .annotate(c=Count('student', distinct=True))
        .values('c')[:1]
    )

    # ---------- LESSON-LEVEL OBJECT ----------
    lesson_qs = (
        Lesson.objects
        .filter(lesson_id=lesson_id, designer = inst)
        .annotate(
            tot_lesson_stud     = Coalesce(Subquery(tot_lesson_stud_sq, output_field=IntegerField()), 0),
            asgn_count          = Coalesce(Subquery(asgn_count_sq, output_field=IntegerField()), 0),
            read_count          = Coalesce(Subquery(read_count_sq, output_field=IntegerField()), 0),
            tot_asgns_readings  = F('asgn_count') + F('read_count'),
            done_asgn           = Coalesce(Subquery(done_asgn_sq, output_field=IntegerField()), 0),
            done_read           = Coalesce(Subquery(done_read_sq, output_field=IntegerField()), 0),
            enrolled_count      = Count("lessonenrollment", distinct=True)
        )
        .annotate(
            tot_done            = F('done_asgn') + F('done_read'),
            avg_done            = _safe_div(F('tot_done'), F('tot_lesson_stud')),
            lesson_progress     = _safe_div(F('avg_done'), F('tot_asgns_readings')),
            lesson_progress_percentage = F('lesson_progress') * 100.0,
        )
        .values(
            'lesson_id', 'title', 'credits',
            'tot_lesson_stud', 'asgn_count', 'read_count', 'tot_asgns_readings',
            'done_asgn', 'done_read', 'tot_done',
            'avg_done', 'lesson_progress', 'lesson_progress_percentage',
            "enrolled_count"
        )
    )

    lesson = lesson_qs.first()
    if not lesson:
        raise Lesson.DoesNotExist(f"Lesson {lesson_id} not found")

    payload: Dict[str, Any] = {"lesson": lesson}

    # ---------- OPTIONAL: STUDENTS LIST ----------
    if not include_students:
        return payload

    # Common subqueries used for student annotations
    enrolled_at_sq = (
        LessonEnrollment.objects
        .filter(lesson__lesson_id=lesson_id, student=OuterRef('pk'))
        .values('enrolled_at')[:1]
    )

    # Session fields (lesson-level fallback)
    session_location_sq = (
        LessonClassroom.objects
        .filter(lesson__lesson_id=lesson_id)
        .values('classroom__location')[:1]
    )
    session_day_sq = (
        LessonClassroom.objects
        .filter(lesson__lesson_id=lesson_id)
        .values('day_of_week')[:1]
    )
    session_start_sq = (
        LessonClassroom.objects
        .filter(lesson__lesson_id=lesson_id)
        .values('time_start')[:1]
    )
    session_end_sq = (
        LessonClassroom.objects
        .filter(lesson__lesson_id=lesson_id)
        .values('time_end')[:1]
    )

    asgn_completed_sq = (
        StudentAssignmentProgress.objects
        .filter(student=OuterRef('pk'),
                assignment__lesson__lesson_id=lesson_id,
                is_completed=True)
        .values('student')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    reading_completed_sq = (
        StudentReadingProgress.objects
        .filter(student=OuterRef('pk'),
                reading__lesson__lesson_id=lesson_id)
        .filter(Q(is_completed=True) | Q(completed=True))
        .values('student')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )

    tot_asgns_readings_val = lesson['tot_asgns_readings'] or 0

    students_qs = (
        StudentProfile.objects
        .filter(lessonenrollment__lesson__lesson_id=lesson_id)
        .distinct()
        .annotate(
            email = F('user__email'),
            enrolled_at = Coalesce(Subquery(enrolled_at_sq, output_field=DateTimeField()), Value(None, output_field=DateTimeField())),
            session_location = Subquery(session_location_sq),
            session_day_of_week = Subquery(session_day_sq),
            session_time_start = Subquery(session_start_sq),
            session_time_end = Subquery(session_end_sq),
            asgn_completed = Coalesce(Subquery(asgn_completed_sq, output_field=IntegerField()), 0),
            reading_completed = Coalesce(Subquery(reading_completed_sq, output_field=IntegerField()), 0),
        )
        .annotate(
            tot_completed = F('asgn_completed') + F('reading_completed'),
        )

        .values(
            'student_profile_id', 'student_no', 'title', 'first_name', 'last_name', 'email', 'enrolled_at',
            'session_location', 'session_day_of_week', 'session_time_start', 'session_time_end',
            'asgn_completed', 'reading_completed', 'tot_completed',
        )
    )

    students: List[Dict[str, Any]] = list(students_qs)

    # Add per-student lesson_progress and shape session object
    if tot_asgns_readings_val > 0:
        denom = float(tot_asgns_readings_val)
        for s in students:
            s['lesson_progress'] = float(s['tot_completed']) / denom
    else:
        for s in students:
            s['lesson_progress'] = 0.0

    for s in students:
        s['session'] = {
            "location":   s.pop('session_location'),
            "day_of_week": s.pop('session_day_of_week'),
            "time_start":  s.pop('session_time_start'),
            "time_end":    s.pop('session_time_end'),
        }

    payload["students"] = students
    return payload

"""
For singular course to look at progress of lessons and students related to it
"""

# ---- helpers --------------------------------------------------------------

def _ratio(numer, denom, default=0.0):
    """Build a safe float division ExpressionWrapper(numer/denom)."""
    return Case(
        When(**{f"{denom.name}__gt": 0}, then=ExpressionWrapper(numer / denom, output_field=FloatField())),
        default=Value(default),
        output_field=FloatField(),
    )

# ---- main ---------------------------------------------------------------

def get_course_progress(user, course_id):
    """
    Returns a dict:
      {
        'course': {... top-level annotations ...},
        'lessons': [ ... per-lesson objects ... ],
        'students': [ ... per-student objects ... ],
      }
    """

    # ---- 1) Course-level aggregates -------------------------------------
    Course = apps.get_model('api', 'Course')
    Lesson = apps.get_model('api', 'Lesson')
    LessonEnrollment = apps.get_model('api', 'LessonEnrollment')
    StudentProfile = apps.get_model('api', 'StudentProfile')
    LessonAssignment = apps.get_model('api', 'LessonAssignment')
    LessonReading = apps.get_model('api', 'LessonReading')
    StudentAssignmentProgress = apps.get_model('api', 'StudentAssignmentProgress')
    StudentReadingProgress = apps.get_model('api', 'StudentReadingProgress')

    inst = get_object_or_404(InstructorProfile, user = user)

    # Count lessons in the course
    course_qs = (
        Course.objects
        .filter(course_id=course_id)
        .annotate(
            tot_lessons=Count('lesson', distinct=True),
            # distinct student count via lesson enrollments
            enrolled_count=Count('lesson__lessonenrollment__student', distinct=True),

            # total completed lesson enrollments across the course
            sum_completed=Count(
                'lesson__lessonenrollment',
                filter=(
                    Q(lesson__lessonenrollment__status='Completed') 
                ),
                distinct=False,  # counting completions, not distinct students
            ),
        )
    )

    course_obj = course_qs.first()
    if not course_obj:
        raise Course.DoesNotExist(f"Course {course_id} not found")

    # ratios: avg_completed = sum_completed / enrolled_count
    course_obj.avg_completed = _ratio(F('sum_completed'), F('enrolled_count')).resolve_expression(course_qs.query, allow_joins=True)
    # avg_progress = avg_completed / tot_lessons
    course_obj.avg_progress = _ratio(course_obj.avg_completed, F('tot_lessons')).resolve_expression(course_qs.query, allow_joins=True)
    # compute with ORM-friendly evaluation:
    course_dict = (
        course_qs
        .annotate(
            avg_completed = _ratio(F('sum_completed'), F('enrolled_count')),
            avg_progress  = _ratio(_ratio(F('sum_completed'), F('enrolled_count')), F('tot_lessons')),
            avg_percentages = ExpressionWrapper(
                _ratio(_ratio(F('sum_completed'), F('enrolled_count')), F('tot_lessons')) * 100.0,
                output_field=FloatField()
            ),
        )
        .values(
            'course_id', 'title', 'credits',  # add other course fields you need
            'tot_lessons', 'enrolled_count', 'sum_completed',
            'avg_completed', 'avg_progress', 'avg_percentages'
        )
        .get()
    )

    tot_lessons = course_dict['tot_lessons'] or 0  # used later for students’ avg

    # ---- 2) Lessons list (role-aware) -----------------------------------
    lessons_base = Lesson.objects.filter(course__course_id=course_id)
    # role check, see if course instructor 
    is_director = course_obj.director == inst
    if not is_director:
        # assumes Lesson has a 'designer' FK to user --> get only related lesson
        lessons_base = lessons_base.filter(designer=user)

    lessons_qs = (
        lessons_base
        .annotate(
            enrolled_count =Count('lessonenrollment__student', distinct=True),
            # total distinct students in this lesson
            tot_lesson_stud=Count('lessonenrollment__student', distinct=True),

            # totals of content items
            asgn_count=Count('lessonassignment', distinct=True),
            read_count=Count('lessonreading', distinct=True),
            tot_asgns_readings=F('asgn_count') + F('read_count'),

            # completed progress items (assignment + reading)
            done_asgn=Count(
                'lessonassignment__studentassignmentprogress',
                filter=Q(lessonassignment__studentassignmentprogress__is_completed=True),
                distinct=True,   # per assignment-progress record; switch off if you want raw rows
            ),
            done_read=Count(
                'lessonreading__studentreadingprogress',
                filter=Q(lessonreading__studentreadingprogress__is_completed=True) |
                        Q(lessonreading__studentreadingprogress__completed=True),
                distinct=True,
            ),
        )
        .annotate(
            tot_done=F('done_asgn') + F('done_read'),
            # avg_done = tot_done / tot_lesson_stud
            avg_done=_ratio(F('tot_done'), F('tot_lesson_stud')),
            # lesson_progress = avg_done / tot_asgns_readings
            lesson_progress=_ratio(F('avg_done'), F('tot_asgns_readings')),
            lesson_progress_percentage=ExpressionWrapper(F('lesson_progress') * 100.0, output_field=FloatField()),
        )
        .values(
            'lesson_id', 'title', 'credits',  # include what you need
            'tot_lesson_stud', 'asgn_count', 'read_count', 'tot_asgns_readings',
            'done_asgn', 'done_read', 'tot_done',
            'avg_done', 'lesson_progress', 'lesson_progress_percentage',
            'enrolled_count'
        )
    )
    lessons = list(lessons_qs)

    # ---- 3) Students list ------------------------------------------------
    #Get all students however
    students_qs = (
        StudentProfile.objects
        .filter(lessonenrollment__lesson__course__course_id=course_id)
        .distinct()
        .annotate(
            enrolled_at = F(
                'enrollment__enrolled_at',
                filter=Q(enrollment__course__course_id=course_id)
                ),
            lessons_completed=Count(
                'lessonenrollment',
                filter=Q(lessonenrollment__lesson__course__course_id=course_id) & (
                    Q(lessonenrollment__status='Complete') |
                    Q(lessonenrollment__is_completed=True)
                ),
                distinct=True,
            ),
            credits_earned=Coalesce(
                Sum(
                    'lessonenrollment__lesson__credits',
                    filter=Q(lessonenrollment__lesson__course__course_id=course_id) & (
                        Q(lessonenrollment__status='Complete') |
                        Q(lessonenrollment__is_completed=True)
                    ),
                ),
                0
            ),
        )
        .values('student_profile_id', 'student_no','last_name', "first_name", "title", 'email', 'lessons_completed', 'credits_earned', "enrolled_at")
    )
    students = list(students_qs)

    # add avg_course_progress per student (needs tot_lessons from course)
    if tot_lessons > 0:
        for s in students:
            s['avg_course_progress'] = float(s['lessons_completed']) / float(tot_lessons)
    else:
        for s in students:
            s['avg_course_progress'] = 0.0

    return {
        "course": course_dict,
        "lessons": lessons,
        "students": students,
    }


"""
For student progress
"""
# api/utils/student_progress.py
from typing import Dict, Any, List, Optional
from django.apps import apps
from django.db.models import (
    Count, Sum, F, Q, Value, FloatField, IntegerField, DateTimeField,
    OuterRef, Subquery, Case, When
)
from django.db.models.functions import Coalesce


def _safe_div(num_expr, den_expr, as_float=True):
    """num/den guarded against zero; returns 0 if denominator <= 0."""
    out = FloatField() if as_float else IntegerField()
    # works with F() den_expr
    return Case(
        When(**{f"{den_expr.name}__gt": 0}, then=num_expr / den_expr),
        default=Value(0.0 if as_float else 0),
        output_field=out,
    )

def compute_student_singular(
    student_profile_id: int | str,
    *,
    course_id: Optional[str] = None,
    session_source: str = "per_student",  # "per_student" uses ClassroomEnrollment if available; "lesson" falls back to first LessonClassroom of lesson
) -> Dict[str, Any]:
    """
    Student Singular Object (related courses only).

    Returns:
      {
        "student": {... student fields ...},
        # if course_id is None:
        "courses": [ { per-course aggregates for this student } ],
        # else:
        "course": { id/title/enrolled_count },
        "lessons": [ { per-lesson aggregates for this student in that course } ],
      }

    Assumed models / fields (rename if yours differ):
      - StudentProfile(student_profile_id PK, user FK -> auth user for email, title, first_name, last_name, student_no, locked_at)
      - Course(course_id, title, credits)
      - Enrollment (student, course, enrolled_at) 
      - Lesson(lesson_id, course FK)
      - LessonEnrollment(lesson, student, enrolled_at, status or is_completed)
      - LessonAssignment(lesson), LessonReading(lesson)
      - StudentAssignmentProgress(student, assignment, is_completed)
      - StudentReadingProgress(student, reading, is_completed or completed)
      - LessonClassroom(lesson, classroom, day_of_week, time_start, time_end)
      - ClassroomEnrollment(student, lessonclassroom)  # only if you truly track session per student
    """
    # --- models ---
    StudentProfile            = apps.get_model('api', 'StudentProfile')
    Course                    = apps.get_model('api', 'Course')
    Enrollment          = apps.get_model('api', 'Enrollment')  # adjust if yours is Enrollment
    Lesson                    = apps.get_model('api', 'Lesson')
    LessonEnrollment          = apps.get_model('api', 'LessonEnrollment')
    LessonAssignment          = apps.get_model('api', 'LessonAssignment')
    LessonReading             = apps.get_model('api', 'LessonReading')
    StudentAssignmentProgress = apps.get_model('api', 'StudentAssignmentProgress')
    StudentReadingProgress    = apps.get_model('api', 'StudentReadingProgress')
    LessonClassroom           = apps.get_model('api', 'LessonClassroom')

    # classroom enrollment is optional in many schemas
    try:
        ClassroomEnrollment = apps.get_model('api', 'ClassroomEnrollment')
    except LookupError:
        ClassroomEnrollment = None

    # --- student header ---
    stu = (
        StudentProfile.objects
        .filter(pk=student_profile_id)
        .annotate(email=F('user__email'))
        .values('student_profile_id', 'student_no', 'title', 'first_name', 'last_name', 'email', 'locked_at')
        .first()
    )
    if not stu:
        raise StudentProfile.DoesNotExist(f"StudentProfile {student_profile_id} not found")

    result: Dict[str, Any] = {"student": {
        "student_profile_id": stu["student_profile_id"],
        "student_no": stu["student_no"],
        "title": stu["title"],
        "first_name": stu["first_name"],
        "last_name": stu["last_name"],
        "email": stu["email"],
        "locked_at": stu["locked_at"],
    }}

    # =========================================================================================
    # A) NO course_id → list the student’s courses with per-course progress
    # =========================================================================================
    if not course_id:
        # total lessons per course
        tot_lessons_sq = (
            Lesson.objects
            .filter(course__course_id=OuterRef('course__course_id'))
            .values('course__course_id')
            .annotate(c=Count('id'))
            .values('c')[:1]
        )

        # enrolled_count per course (distinct students)
        enrolled_count_sq = (
            Enrollment.objects
            .filter(course__course_id=OuterRef('course__course_id'))
            .values('course__course_id')
            .annotate(c=Count('student', distinct=True))
            .values('c')[:1]
        )

        # lessons_done for THIS student in that course
        lessons_done_sq = (
            LessonEnrollment.objects
            .filter(
                lesson__course__course_id=OuterRef('course__course_id'),
                student__student_profile_id=student_profile_id
            )
            .filter(Q(status='Complete'))
            .values('lesson__course__course_id')
            .annotate(c=Count('id'))
            .values('c')[:1]
        )

        courses_qs = (
            Enrollment.objects
            .filter(student__student_profile_id=student_profile_id)
            .select_related('course')
            .annotate(
                title=F('course__title'),
                credits=F('course__credits'),
                course_id_val=F('course__course_id'),
                enrolled_count=Coalesce(Subquery(enrolled_count_sq, output_field=IntegerField()), 0),
                tot_lessons=Coalesce(Subquery(tot_lessons_sq, output_field=IntegerField()), 0),
                lessons_done=Coalesce(Subquery(lessons_done_sq, output_field=IntegerField()), 0),
            )
            .annotate(
                progress=_safe_div(F('lessons_done'), F('tot_lessons')),
                progress_percentages=F('progress') * 100.0,
            )
            .values(
                'course_id_val', 'title', 'credits', 'enrolled_at',
                'enrolled_count', 'lessons_done', 'tot_lessons', 'progress', 'progress_percentages',
            )
        )

        courses = []
        for row in courses_qs:
            courses.append({
                "course_id": row["course_id_val"],
                "title": row["title"],
                "credits": row["credits"],
                "enrolled_at": row["enrolled_at"],
                "enrolled_count": row["enrolled_count"],
                "lessons_done": row["lessons_done"],
                "tot_lessons": row["tot_lessons"],
                "progress": row["progress"],
                "progress_percentages": row["progress_percentages"],
            })

        result["courses"] = courses
        return result

    # =========================================================================================
    # B) course_id provided → course header + per-lesson list (for this student)
    # =========================================================================================

    # course header
    course_row = (
        Course.objects
        .filter(course_id=course_id)
        .values('course_id', 'title')
        .first()
    )
    if not course_row:
        raise Course.DoesNotExist(f"Course {course_id} not found")

    # enrolled_count for that course
    enrolled_count_course = (
        Enrollment.objects
        .filter(course__course_id=course_id)
        .values('course__course_id')
        .annotate(c=Count('student', distinct=True))
        .values_list('c', flat=True)[:1]
    )
    enrolled_count_val = list(enrolled_count_course)[0] if enrolled_count_course else 0

    result["course"] = {
        "course_id": course_row["course_id"],
        "title": course_row["title"],
        "enrolled_count": enrolled_count_val,
    }

    # ---------- lesson-level counts for this course ----------
    tot_asgns_sq = (
        LessonAssignment.objects
        .filter(lesson__lesson_id=OuterRef('lesson_id'))
        .values('lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    tot_readings_sq = (
        LessonReading.objects
        .filter(lesson__lesson_id=OuterRef('lesson_id'))
        .values('lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )

    # per-student completion in each lesson
    asgn_completed_sq = (
        StudentAssignmentProgress.objects
        .filter(student__student_profile_id=student_profile_id,
                assignment__lesson__lesson_id=OuterRef('lesson_id'),
                is_completed=True)
        .values('assignment__lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )
    reading_completed_sq = (
        StudentReadingProgress.objects
        .filter(student__student_profile_id=student_profile_id,
                reading__lesson__lesson_id=OuterRef('lesson_id'))
        .filter(Q(is_completed=True) | Q(completed=True))
        .values('reading__lesson__lesson_id')
        .annotate(c=Count('id'))
        .values('c')[:1]
    )

    # enrolled_at for this student per-lesson
    enrolled_at_sq = (
        LessonEnrollment.objects
        .filter(lesson__lesson_id=OuterRef('lesson_id'), student__student_profile_id=student_profile_id)
        .values('enrolled_at')[:1]
    )

    # session fields
    if session_source == "per_student" and ClassroomEnrollment is not None:
        # session via ClassroomEnrollment(student->lessonclassroom)
        sess_lc_sq = (
            ClassroomEnrollment.objects
            .filter(student__student_profile_id=student_profile_id, lessonclassroom__lesson__lesson_id=OuterRef('lesson_id'))
            .values('lessonclassroom_id')[:1]
        )
        session_location_sq = (
            LessonClassroom.objects
            .filter(pk=Subquery(sess_lc_sq))
            .values('classroom__location')[:1]
        )
        session_day_sq = (
            LessonClassroom.objects
            .filter(pk=Subquery(sess_lc_sq))
            .values('day_of_week')[:1]
        )
        session_start_sq = (
            LessonClassroom.objects
            .filter(pk=Subquery(sess_lc_sq))
            .values('time_start')[:1]
        )
        session_end_sq = (
            LessonClassroom.objects
            .filter(pk=Subquery(sess_lc_sq))
            .values('time_end')[:1]
        )
    else:
        # fallback: first LessonClassroom for the lesson
        session_location_sq = (
            LessonClassroom.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'))
            .values('classroom__location')[:1]
        )
        session_day_sq = (
            LessonClassroom.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'))
            .values('day_of_week')[:1]
        )
        session_start_sq = (
            LessonClassroom.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'))
            .values('time_start')[:1]
        )
        session_end_sq = (
            LessonClassroom.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'))
            .values('time_end')[:1]
        )

    lessons_qs = (
        Lesson.objects
        .filter(course__course_id=course_id)
        .annotate(
            enrolled_at=Coalesce(Subquery(enrolled_at_sq, output_field=DateTimeField()),
                                 Value(None, output_field=DateTimeField())),
            tot_asgns=Coalesce(Subquery(tot_asgns_sq, output_field=IntegerField()), 0),
            tot_readings=Coalesce(Subquery(tot_readings_sq, output_field=IntegerField()), 0),
            asgn_completed=Coalesce(Subquery(asgn_completed_sq, output_field=IntegerField()), 0),
            reading_completed=Coalesce(Subquery(reading_completed_sq, output_field=IntegerField()), 0),

            session_day_of_week=Subquery(session_day_sq),
            session_time_start=Subquery(session_start_sq),
            session_time_end=Subquery(session_end_sq),
            session_location=Subquery(session_location_sq),
        )
        .annotate(
            completed_sum=F('asgn_completed') + F('reading_completed'),
            denom_sum=F('tot_asgns') + F('tot_readings'),
            progress=_safe_div(F('completed_sum'), F('denom_sum')),
            progress_percentages=F('progress') * 100.0,
        )
        .values(
            'lesson_id', 'enrolled_at',
            'tot_asgns', 'tot_readings',
            'asgn_completed', 'reading_completed',
            'session_day_of_week', 'session_time_start', 'session_time_end', 'session_location',
            'progress', 'progress_percentages',
        )
    )

    lessons: List[Dict[str, Any]] = []
    for row in lessons_qs:
        lessons.append({
            "lesson_id": row["lesson_id"],
            "enrolled_at": row["enrolled_at"],
            "tot_readings": row["tot_readings"],
            "tot_asgns": row["tot_asgns"],
            "asgn_completed": row["asgn_completed"],
            "reading_completed": row["reading_completed"],
            "day_of_week": row["session_day_of_week"],
            "time_start": row["session_time_start"],
            "time_end": row["session_time_end"],
            "location": row["session_location"],
            "progress": row["progress"],
            "progress_percentages": row["progress_percentages"],
        })

    result["lessons"] = lessons
    return result
