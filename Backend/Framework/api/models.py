# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models, transaction
from django.db.models import Sum, Q, F
from django.utils import timezone
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.db.models.functions import Coalesce
import random
import string
from datetime import date, datetime, time as dtime, timedelta

class ActiveLessonClassroomManager(models.Manager):
    def get_queryset(self):
        now = timezone.now()
        return (super().get_queryset()
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)))


def generate_custom_id():
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    digits = ''.join(random.choices(string.digits, k=4))
    return f"{letters}{digits}"

def generate_student_id():
    digits = ''.join(random.choices(string.digits, k=5))
    return f"3{digits}"


class Classroom(models.Model):
    classroom_id = models.CharField(
        primary_key=True, max_length=6, unique=True,
        default=generate_custom_id, editable=False
    )
    location = models.CharField(max_length=255, blank=True, null=True)
    capacity = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_online = models.BooleanField(default=False)
    zoom_link = models.CharField(max_length=255, blank=True, null=True)


    class Meta:
        managed = True
        db_table = 'classroom'

    def save(self, *args, **kwargs):
        #If online classroom, no location and capacity fixed to 100
        if self.is_online:
            self.capacity =100
        super().save(*args, **kwargs)


class Course(models.Model):
    class CourseStatus(models.TextChoices):
        ACTIVE = "Active", "ACTIVE"
        INACTIVE = "Inactive", "INACTIVE"
        DRAFT = "Draft", "DRAFT"

    course_id = models.CharField(primary_key=True, max_length=6, unique=True, default=generate_custom_id, editable=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=CourseStatus.choices, default=CourseStatus.ACTIVE)
    owner_instructor = models.ForeignKey('InstructorProfile', models.DO_NOTHING)
    credits = models.IntegerField(blank=True, null=True, default=30)
    director = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'course'

    def save(self, *args, **kwargs):
        if not self.course_id:
            # ensure uniqueness: regenerate if collision occurs
            new_id = generate_custom_id()
            while Course.objects.filter(course_id=new_id).exists():
                new_id = generate_custom_id()
            self.course_id = new_id
        super().save(*args, **kwargs)


class Enrollment(models.Model):
    class EnrollmentStatus(models.TextChoices):
        COMPLETED = "Completed", "COMPLETED"
        INCOMPLETE = "Incomplete", "INCOMPLETE"
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    course = models.ForeignKey(Course, models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=EnrollmentStatus.choices, default=EnrollmentStatus.INCOMPLETE)
    
    class Meta:
        managed = True
        db_table = 'enrollment'
        unique_together = (('student', 'course'),)


class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', models.DO_NOTHING)
    title = models.CharField(max_length=40, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    staff_no = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = True
        db_table = 'instructor_profile'

    def clean(self):
        if self.user and self.user.role != "instructor":
            raise ValidationError("Linked user must have role='instructor'.")
        
    def save(self, *args, **kwargs):
        self.full_clean()  # ensures `clean()` runs
        super().save(*args, **kwargs)


class Lesson(models.Model):
    class LessonStatus(models.TextChoices):
        ACTIVE = "Active", "ACTIVE"
        INACTIVE = "Inactive", "INACTIVE"
        ARCHIVED = "Archived", "ARCHIVED"
    class DurationWeeks(models.IntegerChoices):
        TWO = 2, "2"
        THREE = 3, "3"
        FOUR = 4 , "4"
    lesson_id = models.CharField(primary_key=True, max_length=32)
    course = models.ForeignKey(Course, models.DO_NOTHING)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    objectives = models.TextField(blank=True, null=True)
    duration_weeks = models.PositiveIntegerField(blank=True, null=True, choices=DurationWeeks.choices, default=DurationWeeks.FOUR)
    credits = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=LessonStatus.choices, default=LessonStatus.ACTIVE)
    designer = models.ForeignKey(InstructorProfile, models.DO_NOTHING)
    created_by = models.ForeignKey(InstructorProfile, models.DO_NOTHING, db_column='created_by', related_name='lesson_created_by_set')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    estimated_effort = models.IntegerField(blank=True, null=True, default=0)

    class Meta:
        managed = True
        db_table = 'lesson'

    def clean(self):
        """
        Ensure total credits of all lessons in this course, including this one,
        do not exceed course.credits.
        """
        # If credits or course cap are missing, skip cap check
        this_credits = self.credits or 0
        course_cap = (self.course.credits or 0)

        # Sum other lessons in the same course (exclude self to avoid double-counting on update)
        total_other = (Lesson.objects
                       .filter(course=self.course)
                       .exclude(pk=self.pk)
                       .aggregate(s=Coalesce(Sum('credits'), 0))['s']) #Get sum and extract it

        if this_credits + total_other > course_cap:
            raise ValidationError({
                'credits': (f'Credits would exceed course cap ({course_cap}). '
                            f'Currently allocated: {total_other}, this lesson: {this_credits}.')
            })

    def save(self, *args, **kwargs):
        with transaction.atomic():
            Course.objects.select_for_update().get(pk=self.course_id)
            self.full_clean()
            return super().save(*args, **kwargs)


class LessonAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'lesson_assignment'
        constraints = [
            models.UniqueConstraint(
                fields=["lesson", "title"],
                name="uniq_lesson_title",
            )
        ]


class LessonClassroom(models.Model):
    class Day(models.TextChoices):
        MONDAY = "Monday", "MONDAY"
        TUESDAY = "Tuesday", "TUESDAY"
        WEDNESDAY = "Wednesday", "WEDNESDAY"
        THURSDAY = "Thursday", "THURSDAY"
        FRIDAY = "Friday", "FRIDAY"
        SATURDAY = "Saturday", "SATURDAY"
        SUNDAY = "Sunday", "SUNDAY"
    class Weeks(models.IntegerChoices):
        TWO = 2, "2"
        THREE = 3, "3"
        FOUR = 4, "4"
    lesson_classroom_id =  models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    classroom = models.ForeignKey(Classroom, models.DO_NOTHING)
    #session_times_json = models.JSONField(blank=True, null=True)
    day_of_week = models.CharField(blank=True, null=True, choices=Day.choices, default=Day.MONDAY)
    time_start = models.TimeField(default=dtime(0, 0))
    time_end   = models.TimeField(default=dtime(0, 0))
    duration_minutes = models.IntegerField(blank=True, null=True)
    duration_weeks = models.IntegerField(choices=Weeks.choices, default=Weeks.TWO)
    linked_at = models.DateTimeField(auto_now_add=True)
    supervisor = models.ForeignKey(InstructorProfile, models.DO_NOTHING)
    expires_at = models.DateTimeField(blank=True, null=True, db_index=True)
    objects = models.Manager()                
    active  = ActiveLessonClassroomManager()


    class Meta:
        managed = True
        db_table = 'lesson_classroom'
        constraints = [
            models.CheckConstraint(
                check=Q(time_end__gt=F("time_start")),
                name="lessonclassroom_time_end_after_start",
            ),
        ]

    def clean(self):
        # sanity
        if self.time_end <= self.time_start:
            raise ValidationError({"time_end": "time_end must be after time_start."})
        if not (self.classroom_id and self.supervisor_id and self.day_of_week):
            return  # skip until essentials present

        # only consider active rows (remove this if expired rows should still block)
        now = timezone.now()
        active_q = Q(expires_at__isnull=True) | Q(expires_at__gt=now)

        # real overlap (back-to-back OK): start < other_end AND end > other_start
        overlap = Q(time_start__lt=self.time_end) & Q(time_end__gt=self.time_start)

        base = (LessonClassroom.objects
                .filter(active_q, day_of_week=self.day_of_week)
                .exclude(pk=self.pk))

        # same classroom clash?
        if base.filter(classroom_id=self.classroom_id).filter(overlap).exists():
            raise ValidationError("Overlaps an existing session in this classroom.")

        # same supervisor clash?
        if base.filter(supervisor_id=self.supervisor.instructor_profile_id).filter(overlap).exists():
            raise ValidationError("Overlaps another session for this instructor.")

    def save(self, *args, **kwargs):
        # compute derived fields first
        if self.time_start and self.time_end:
            delta = datetime.combine(date.min, self.time_end) - datetime.combine(date.min, self.time_start)
            self.duration_minutes = int(delta.total_seconds() // 60)

        if self.duration_weeks:
            base_dt = self.linked_at or timezone.now()
            if self.pk and self.linked_at:
                base_dt = self.linked_at
            self.expires_at = base_dt + timedelta(weeks=int(self.duration_weeks))
        else:
            self.expires_at = None

        # ENFORCE validation everywhere
        self.full_clean()

        return super().save(*args, **kwargs)

    @property
    def is_expired(self) -> bool:
        return bool(self.expires_at and self.expires_at <= timezone.now())

    
class ClassroomEnrollment(models.Model):
    lesson_classroom = models.ForeignKey(LessonClassroom, models.DO_NOTHING)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom_enrollment'
        unique_together = (('lesson_classroom', 'student'),)


class LessonEnrollment(models.Model):
    """
    TODO: Modify the assignment + reading view on student side
    """
    class EnrollmentStatus(models.TextChoices):
        COMPLETED = "Completed", "COMPLETED"
        INCOMPLETE = "Incomplete", "INCOMPLETE"
    status = models.CharField(max_length=50, choices=EnrollmentStatus.choices, default=EnrollmentStatus.INCOMPLETE)
    lesson_enrollment_id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'lesson_enrollment'
        unique_together = (('lesson', 'student'),)

    def check_completion(self):
        """Check if this enrollment should be marked complete."""
        if not self.student_id or not self.lesson_id:
            raise ValidationError({
                "student": "Student is required.",
                "lesson": "Lesson is required.",
            })

        # total tasks under this lesson
        total_assignments = LessonAssignment.objects.filter(lesson=self.lesson).count()
        total_readings = LessonReading.objects.filter(lesson=self.lesson).count()
        total_items = total_assignments + total_readings

        # student’s completed items for this lesson
        done_assignments = StudentAssignment.objects.filter(
            student_id=self.student_id, lesson_id=self.lesson_id, is_completed=True
        ).count()
        done_readings = StudentReading.objects.filter(
            student_id=self.student_id, lesson_id=self.lesson_id,  is_completed=True
        ).count()
        completed_items = done_assignments + done_readings

        # check if all completed
        all_done = total_items > 0 and completed_items == total_items

        # check duration
        duration = getattr(self.lesson, "duration_week", 0) or 0
        end_date = self.enrolled_at + timedelta(weeks=duration)
        duration_reached = timezone.now() >= end_date

        if all_done and duration_reached:
            self.status = LessonEnrollment.EnrollmentStatus.COMPLETED
        else:
            self.status = LessonEnrollment.EnrollmentStatus.INCOMPLETE
    
    def clean(self):
        self.check_completion()


    def save(self, *args, **kwargs):
        # automatically update status before saving
        # everytime student check on something, make it 
        # enrollment = LessonEnrollment.objects.get(pk=1)
        # enrollment.save()
        with transaction.atomic():
            self.full_clean()  # raises ValidationError -> DRF can turn into 400
            return super().save(*args, **kwargs)

class LessonPrerequisite(models.Model):
    prereq_id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    prereq_lesson = models.ForeignKey(Lesson, models.DO_NOTHING, related_name='lessonprerequisite_prereq_lesson_set')

    class Meta:
        managed = True
        db_table = 'lesson_prerequisite'
        unique_together = (('lesson', 'prereq_lesson'),)


class LessonReading(models.Model):
    reading_id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    title = models.CharField(max_length=255)
    url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'lesson_reading'
        constraints = [
            models.UniqueConstraint(
                fields=['lesson', 'title', 'url'],
                name='uniq_lesson_title_url'
            )
        ]


class StudentAssignment(models.Model):
    student_assignment_id = models.AutoField(primary_key=True)
    assignment = models.ForeignKey(LessonAssignment, models.DO_NOTHING)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    is_completed = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'student_assignment'


class StudentProfile(models.Model):
    student_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', models.DO_NOTHING)
    first_name = models.CharField(max_length=120, blank=True, null=True)
    last_name = models.CharField(max_length=120, blank=True, null=True)
    title = models.CharField(max_length=40, blank=True, null=True)
    student_no = models.CharField(unique=True, max_length=50, default = generate_student_id, editable = True)
    locked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'student_profile'


class StudentReading(models.Model):
    student_reading_id = models.AutoField(primary_key=True)
    reading = models.ForeignKey(LessonReading, models.DO_NOTHING)
    student = models.ForeignKey(StudentProfile, models.DO_NOTHING)
    is_completed = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'student_reading'


class AdminProfile(models.Model):
    admin_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', models.DO_NOTHING)
    full_name = models.CharField(max_length=255)
    # staff_no = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = True
        db_table = 'admin_profile'

class User(models.Model):
    class Roles(models.TextChoices):
        INSTRUCTOR = "instructor", "instructor"
        STUDENT = "student", "student"
        ADMIN = "admin", "admin"

    user_id = models.AutoField(primary_key=True)
    email = models.CharField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=50,choices=Roles.choices, default=Roles.INSTRUCTOR)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'user'

    @property 
    def is_authenticated(self):
        return True

