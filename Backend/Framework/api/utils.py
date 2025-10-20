import re
from django.db import transaction
from rest_framework import serializers
from .models import * 

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
