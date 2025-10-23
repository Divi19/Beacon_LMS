import re
from django.db import transaction
from django.apps import apps
from django.shortcuts import get_object_or_404
from django.apps import apps
from django.db.models import (
    Count, Sum, F, Q, Value, FloatField, IntegerField, DateTimeField,
    TimeField,
    OuterRef, Subquery, Case, When, ExpressionWrapper, Min, CharField
)
from django.db.models.functions import Coalesce, Trunc, Cast, NullIf
from django.utils import timezone
from datetime import timedelta

from rest_framework import serializers
from .models import * 
from typing import Dict, Any, List, Optional


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
            .select_for_update()
            .select_related("lesson", "student")
            .get(pk=enrollment_id)
        )

        lesson = enrollment.lesson
        student = enrollment.student

        # totals for that lesson
        tot_asgns = LessonAssignment.objects.filter(lesson=lesson).count()
        tot_reads = LessonReading.objects.filter(lesson=lesson).count()

        # done by this student for that lesson
        done_asgns = StudentAssignmentProgress.objects.filter(
            student=student, assignment__lesson=lesson, is_completed=True
        ).count()

        done_reads = StudentReadingProgress.objects.filter(
            student=student, reading__lesson=lesson, is_completed=True
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


def _safe_div(num_expr, den_expr, as_float=True):
    """Return num/den but 0 when denominator <= 0 (ORM expression)."""
    out = FloatField() if as_float else IntegerField()
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
    session_source: str = "lesson",
) -> Dict[str, Any]:
    """
    Build the 'Lesson Progress - Singular Object' payload with FIXED calculations.
    """
    Lesson = apps.get_model('api', 'Lesson')
    LessonEnrollment = apps.get_model('api', 'LessonEnrollment')
    LessonAssignment = apps.get_model('api', 'LessonAssignment')
    LessonReading = apps.get_model('api', 'LessonReading')
    StudentProfile = apps.get_model('api', 'StudentProfile')
    StudentAssignmentProgress = apps.get_model('api', 'StudentAssignmentProgress')
    StudentReadingProgress = apps.get_model('api', 'StudentReadingProgress')
    LessonClassroom = apps.get_model('api', 'LessonClassroom')
    InstructorProfile = apps.get_model('api', 'InstructorProfile')
    ClassroomEnrollment = apps.get_model('api', 'ClassroomEnrollment')

    inst = get_object_or_404(InstructorProfile, user=user)

    # Get lesson with basic counts
    lesson_obj = Lesson.objects.filter(
        lesson_id=lesson_id,
        designer=inst
    ).first()
    
    if not lesson_obj:
        raise Lesson.DoesNotExist(f"Lesson {lesson_id} not found")

    # Get accurate counts
    tot_lesson_stud = LessonEnrollment.objects.filter(
        lesson__lesson_id=lesson_id
    ).values('student').distinct().count()
    
    asgn_count = LessonAssignment.objects.filter(lesson__lesson_id=lesson_id).count()
    read_count = LessonReading.objects.filter(lesson__lesson_id=lesson_id).count()
    tot_asgns_readings = asgn_count + read_count

    # Count completions properly - total across all students
    done_asgn = StudentAssignmentProgress.objects.filter(
        assignment__lesson__lesson_id=lesson_id,
        is_completed=True
    ).count()
    
    done_read = StudentReadingProgress.objects.filter(
        reading__lesson__lesson_id=lesson_id,
        is_completed=True
    ).count()

    tot_done = done_asgn + done_read
    avg_done = tot_done / tot_lesson_stud if tot_lesson_stud > 0 else 0
    lesson_progress = avg_done / tot_asgns_readings if tot_asgns_readings > 0 else 0

    lesson = {
        'lesson_id': lesson_obj.lesson_id,
        'title': lesson_obj.title,
        'credits': lesson_obj.credits,
        'tot_lesson_stud': tot_lesson_stud,
        'asgn_count': asgn_count,
        'read_count': read_count,
        'tot_asgns_readings': tot_asgns_readings,
        'done_asgn': done_asgn,
        'done_read': done_read,
        'tot_done': tot_done,
        'avg_done': round(avg_done, 2),
        'lesson_progress': round(lesson_progress, 4),
        'lesson_progress_percentage': round(lesson_progress * 100, 2),
        'enrolled_count': tot_lesson_stud
    }

    payload: Dict[str, Any] = {"lesson": lesson}

    if not include_students:
        return payload

    # Get students enrolled in this lesson
    students_qs = StudentProfile.objects.filter(
        lessonenrollment__lesson__lesson_id=lesson_id
    ).distinct()

    students: List[Dict[str, Any]] = []

    for student in students_qs:
        # Get enrollment date
        enrollment = LessonEnrollment.objects.filter(
            lesson__lesson_id=lesson_id,
            student=student
        ).first()

        enrolled_at = None
        if enrollment and enrollment.enrolled_at:
            enrolled_at = enrollment.enrolled_at.strftime('%d/%m/%Y %H:%M')

        # Get classroom session info
        classroom_enrollment = ClassroomEnrollment.objects.filter(
            student=student,
            lesson_classroom__lesson__lesson_id=lesson_id
        ).select_related('lesson_classroom__classroom').first()

        session = {
            "location": None,
            "day_of_week": None,
            "time_start": None,
            "time_end": None,
        }

        if classroom_enrollment:
            lc = classroom_enrollment.lesson_classroom
            session = {
                "location": lc.classroom.location if lc.classroom else None,
                "day_of_week": lc.day_of_week,
                "time_start": lc.time_start.strftime("%H:%M") if lc.time_start else None,
                "time_end": lc.time_end.strftime("%H:%M") if lc.time_end else None,
            }

        # Count this student's completions
        asgn_completed = StudentAssignmentProgress.objects.filter(
            student=student,
            assignment__lesson__lesson_id=lesson_id,
            is_completed=True
        ).count()

        reading_completed = StudentReadingProgress.objects.filter(
            student=student,
            reading__lesson__lesson_id=lesson_id,
            is_completed=True
        ).count()

        tot_completed = asgn_completed + reading_completed
        student_progress = tot_completed / tot_asgns_readings if tot_asgns_readings > 0 else 0

        students.append({
            'student_profile_id': student.student_profile_id,
            'student_no': student.student_no,
            'title': student.title,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.user.email,
            'enrolled_at': enrolled_at,
            'session': session,
            'asgn_completed': asgn_completed,
            'reading_completed': reading_completed,
            'tot_completed': tot_completed,
            'lesson_progress': round(student_progress, 4)
        })

    payload["students"] = students
    return payload


def _ratio(numer, denom, default=0.0):
    """Build a safe float division ExpressionWrapper(numer/denom)."""
    return Case(
        When(**{f"{denom.name}__gt": 0}, then=ExpressionWrapper(numer / denom, output_field=FloatField())),
        default=Value(default),
        output_field=FloatField(),
    )


def get_course_progress(user, course_id):
    """
    Returns a dict with FIXED progress calculations:
      {
        'course': {... top-level annotations ...},
        'lessons': [ ... per-lesson objects ... ],
        'students': [ ... per-student objects ... ],
      }
    """

    Course = apps.get_model('api', 'Course')
    Lesson = apps.get_model('api', 'Lesson')
    LessonEnrollment = apps.get_model('api', 'LessonEnrollment')
    StudentProfile = apps.get_model('api', 'StudentProfile')
    LessonAssignment = apps.get_model('api', 'LessonAssignment')
    LessonReading = apps.get_model('api', 'LessonReading')
    StudentAssignmentProgress = apps.get_model('api', 'StudentAssignmentProgress')
    StudentReadingProgress = apps.get_model('api', 'StudentReadingProgress')
    Enrollment = apps.get_model('api', 'Enrollment')
    InstructorProfile = apps.get_model('api', 'InstructorProfile')

    inst = get_object_or_404(InstructorProfile, user=user)

    # ---- 1) Course-level aggregates with FIXED completion logic ----
    course_qs = (
        Course.objects
        .filter(course_id=course_id)
        .annotate(
            tot_lessons=Count('lesson', distinct=True),
            enrolled_count=Count('enrollment__student', distinct=True, filter=Q(enrollment__course__course_id=course_id)),
        )
    )

    course_obj = course_qs.first()
    if not course_obj:
        raise Course.DoesNotExist(f"Course {course_id} not found")

    # Calculate sum_completed using a separate query to avoid duplicates
    sum_completed = LessonEnrollment.objects.filter(
        lesson__course__course_id=course_id,
        status='Completed'
    ).count()

    tot_lessons = course_obj.tot_lessons or 1
    enrolled_count = course_obj.enrolled_count or 1

    avg_completed = sum_completed / enrolled_count if enrolled_count > 0 else 0
    avg_progress = avg_completed / tot_lessons if tot_lessons > 0 else 0
    avg_percentages = avg_progress * 100.0

    course_dict = {
        'course_id': course_obj.course_id,
        'title': course_obj.title,
        'credits': course_obj.credits,
        'tot_lessons': tot_lessons,
        'enrolled_count': enrolled_count,
        'sum_completed': sum_completed,
        'avg_completed': round(avg_completed, 2),
        'avg_progress': round(avg_progress, 4),
        'avg_percentages': round(avg_percentages, 2)
    }

    # ---- 2) Lessons list (role-aware) with FIXED progress calculation ----
    lessons_base = Lesson.objects.filter(course__course_id=course_id)
    is_director = course_obj.owner_instructor == inst
    if not is_director:
        lessons_base = lessons_base.filter(designer=inst)

    lessons_qs = (
        lessons_base
        .annotate(
            enrolled_count=Count('lessonenrollment__student', distinct=True),
            tot_lesson_stud=Count('lessonenrollment__student', distinct=True),
            asgn_count=Count('lessonassignment', distinct=True),
            read_count=Count('lessonreading', distinct=True),
        )
    )

    lessons = []
    for lesson in lessons_qs:
        tot_asgns_readings = lesson.asgn_count + lesson.read_count
        
        if tot_asgns_readings > 0 and lesson.tot_lesson_stud > 0:
            done_asgn = StudentAssignmentProgress.objects.filter(
                assignment__lesson=lesson,
                is_completed=True
            ).count()
            
            done_read = StudentReadingProgress.objects.filter(
                reading__lesson=lesson,
                is_completed=True
            ).count()
            
            tot_done = done_asgn + done_read
            avg_done = tot_done / lesson.tot_lesson_stud if lesson.tot_lesson_stud > 0 else 0
            lesson_progress = avg_done / tot_asgns_readings if tot_asgns_readings > 0 else 0
        else:
            done_asgn = 0
            done_read = 0
            tot_done = 0
            avg_done = 0
            lesson_progress = 0

        lessons.append({
            'lesson_id': lesson.lesson_id,
            'title': lesson.title,
            'credits': lesson.credits,
            'tot_lesson_stud': lesson.tot_lesson_stud,
            'asgn_count': lesson.asgn_count,
            'read_count': lesson.read_count,
            'tot_asgns_readings': tot_asgns_readings,
            'done_asgn': done_asgn,
            'done_read': done_read,
            'tot_done': tot_done,
            'avg_done': round(avg_done, 2),
            'lesson_progress': round(lesson_progress, 4),
            'lesson_progress_percentage': round(lesson_progress * 100, 2),
            'enrolled_count': lesson.enrolled_count,
            'duration_weeks': lesson.duration_weeks
        })

    # ---- 3) Students list with FIXED completion counting ----
    students_qs = (
        StudentProfile.objects
        .filter(enrollment__course__course_id=course_id)
        .distinct()
        .annotate(
            email=F('user__email'),
            min_enrolled_at=Min(
                'enrollment__enrolled_at',
                filter=Q(enrollment__course__course_id=course_id)
            ),
            enrolled_at=Cast(
                Trunc('min_enrolled_at', 'minute', output_field=DateTimeField()),
                output_field=CharField()
            ),
        )
    )

    students = []
    for student in students_qs:
        lessons_completed = LessonEnrollment.objects.filter(
            student=student,
            lesson__course__course_id=course_id,
            status='Completed'
        ).count()
        
        credits_earned = LessonEnrollment.objects.filter(
            student=student,
            lesson__course__course_id=course_id,
            status='Completed'
        ).aggregate(
            total=Coalesce(Sum('lesson__credits'), 0)
        )['total']

        avg_course_progress = lessons_completed / tot_lessons if tot_lessons > 0 else 0

        students.append({
            'student_profile_id': student.student_profile_id,
            'student_no': student.student_no,
            'last_name': student.last_name,
            'first_name': student.first_name,
            'title': student.title,
            'email': student.email,
            'lessons_completed': lessons_completed,
            'credits_earned': credits_earned,
            'enrolled_at': student.enrolled_at,
            'avg_course_progress': round(avg_course_progress, 4)
        })

    return {
        "course": course_dict,
        "lessons": lessons,
        "students": students,
    }


def compute_student_singular(
    student_profile_id: int | str,
    *,
    course_id: Optional[str] = None,
    session_source: str = "per_student",
) -> Dict[str, Any]:
    """
    Student Singular Object (related courses only).
    """
    StudentProfile = apps.get_model('api', 'StudentProfile')
    Course = apps.get_model('api', 'Course')
    Enrollment = apps.get_model('api', 'Enrollment')
    Lesson = apps.get_model('api', 'Lesson')
    LessonEnrollment = apps.get_model('api', 'LessonEnrollment')
    LessonAssignment = apps.get_model('api', 'LessonAssignment')
    LessonReading = apps.get_model('api', 'LessonReading')
    StudentAssignmentProgress = apps.get_model('api', 'StudentAssignmentProgress')
    StudentReadingProgress = apps.get_model('api', 'StudentReadingProgress')
    LessonClassroom = apps.get_model('api', 'LessonClassroom')

    try:
        ClassroomEnrollment = apps.get_model('api', 'ClassroomEnrollment')
    except LookupError:
        ClassroomEnrollment = None

    # --- student header ---
    stu = (
        StudentProfile.objects
        .filter(pk=student_profile_id)
        .annotate(email=F('user__email'))
        .annotate(
            registered_at=Cast(
                Trunc('locked_at', 'minute', output_field=DateTimeField()),
                output_field=CharField()
            ),
        )
        .values('student_profile_id', 'student_no', 'title', 'first_name', 'last_name', 'email', 'registered_at')
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
        "registered_at": stu["registered_at"],
    }}

    if not course_id:
        # List all courses for this student
        tot_lessons_sq = (
            Lesson.objects
            .filter(course__course_id=OuterRef('course__course_id'))
            .values('course__course_id')
            .annotate(c=Count('lesson_id'))
            .values('c')[:1]
        )

        enrolled_count_sq = (
            Course.objects
            .filter(course_id=OuterRef('course__course_id'))
            .values('course_id')
            .annotate(c=Count('enrollment', distinct=True))
            .values('c')[:1]
        )

        lessons_done_sq = (
            LessonEnrollment.objects
            .filter(
                lesson__course__course_id=OuterRef('course__course_id'),
                student__student_profile_id=student_profile_id
            )
            .filter(Q(status='Completed'))
            .values('lesson__course__course_id')
            .annotate(c=Count('lesson_enrollment_id'))
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
                new_enrolled_at=Cast(
                    Trunc('enrolled_at', 'minute', output_field=DateTimeField()),
                    output_field=CharField()
                ),
            )
        )

        courses = []
        for row in courses_qs:
            tot_lessons = row.tot_lessons if row.tot_lessons > 0 else 1
            progress = row.lessons_done / tot_lessons
            progress_percentages = progress * 100.0

            courses.append({
                "course_id": row.course_id_val,
                "title": row.title,
                "credits": row.credits,
                "enrolled_at": row.new_enrolled_at,
                "enrolled_count": row.enrolled_count,
                "lessons_done": row.lessons_done,
                "tot_lessons": row.tot_lessons,
                "progress": round(progress, 4),
                "progress_percentages": round(progress_percentages, 2),
            })

        result["courses"] = courses
        return result

    else:
        # Course-specific view
        course_row = (
            Course.objects
            .filter(course_id=course_id)
            .values('course_id', 'title')
            .first()
        )
        if not course_row:
            raise Course.DoesNotExist(f"Course {course_id} not found")

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

        tot_asgns_sq = (
            LessonAssignment.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'))
            .values('lesson__lesson_id')
            .annotate(c=Count('assignment_id'))
            .values('c')[:1]
        )
        tot_readings_sq = (
            LessonReading.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'))
            .values('lesson__lesson_id')
            .annotate(c=Count('reading_id'))
            .values('c')[:1]
        )

        asgn_completed_sq = (
            StudentAssignmentProgress.objects
            .filter(student__student_profile_id=student_profile_id,
                    assignment__lesson__lesson_id=OuterRef('lesson_id'),
                    is_completed=True)
            .values('assignment__lesson__lesson_id')
            .annotate(c=Count('student_assignment_id'))
            .values('c')[:1]
        )
        reading_completed_sq = (
            StudentReadingProgress.objects
            .filter(student__student_profile_id=student_profile_id,
                    reading__lesson__lesson_id=OuterRef('lesson_id'))
            .filter(Q(is_completed=True))
            .values('reading__lesson__lesson_id')
            .annotate(c=Count('student_reading_id'))
            .values('c')[:1]
        )

        enrolled_at_sq = (
            LessonEnrollment.objects
            .filter(lesson__lesson_id=OuterRef('lesson_id'), student__student_profile_id=student_profile_id)
            .values('enrolled_at')[:1]
        )

        if session_source == "per_student" and ClassroomEnrollment is not None:
            sess_lc_sq = (
                ClassroomEnrollment.objects
                .filter(student__student_profile_id=student_profile_id, lesson_classroom__lesson__lesson_id=OuterRef('lesson_id'))
                .values('lesson_classroom_id')[:1]
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
            .filter(course__course_id=course_id, lessonenrollment__student__student_profile_id=student_profile_id)
            .annotate(
                enrolled_at=Coalesce(Subquery(enrolled_at_sq, output_field=DateTimeField()),
                                    Value(None, output_field=DateTimeField())),
                tot_asgns=Coalesce(Subquery(tot_asgns_sq, output_field=IntegerField()), 0),
                tot_readings=Coalesce(Subquery(tot_readings_sq, output_field=IntegerField()), 0),
                asgn_completed=Coalesce(Subquery(asgn_completed_sq, output_field=IntegerField()), 0),
                reading_completed=Coalesce(Subquery(reading_completed_sq, output_field=IntegerField()), 0),
                joined_at=Cast(
                    Trunc('enrolled_at', 'minute', output_field=DateTimeField()),
                    output_field=CharField()
                ), 
                session_day_of_week=Subquery(session_day_sq),
                session_time_start=Subquery(session_start_sq),
                session_time_end=Subquery(session_end_sq),
                session_location=Subquery(session_location_sq),
            )
            .values(
                'lesson_id', 'enrolled_at', 'title', 'joined_at',
                'tot_asgns', 'tot_readings',
                'asgn_completed', 'reading_completed',
                'session_day_of_week', 'session_time_start', 'session_time_end', 'session_location',
            )
        )

        lessons: List[Dict[str, Any]] = []
        for row in lessons_qs:
            completed_sum = row['asgn_completed'] + row['reading_completed']
            denom_sum = row['tot_asgns'] + row['tot_readings']
            progress = completed_sum / denom_sum if denom_sum > 0 else 0
            progress_percentages = progress * 100.0

            lessons.append({
                "lesson_id": row["lesson_id"],
                "title": row["title"],
                "enrolled_at": row["enrolled_at"],
                "tot_readings": row["tot_readings"],
                "tot_asgns": row["tot_asgns"],
                "asgn_completed": row["asgn_completed"],
                "reading_completed": row["reading_completed"],
                "day_of_week": row["session_day_of_week"],
                "time_start": row["session_time_start"].strftime("%H:%M") if row["session_time_start"] else None,
                "time_end": row["session_time_end"].strftime("%H:%M") if row["session_time_end"] else None,
                "location": row["session_location"],
                "progress": round(progress, 4),
                "progress_percentages": round(progress_percentages, 2),
                "joined_at": row["joined_at"]
            })

        result["lessons"] = lessons
        return result
