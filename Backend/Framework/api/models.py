# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.utils import timezone
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
import random
import string
import datetime
from datetime import date, datetime, time as dtime

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
    duration_weeks = models.IntegerField(blank=True, null=True)
    capacity = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_online = models.BooleanField(default=False)

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
        COMPLETED = "Complete", "COMPLETED"
        INCOMPLETE = "Incomplete", "INCOMPLETE"

    course_id = models.CharField(primary_key=True, max_length=6, unique=True, default=generate_custom_id, editable=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=CourseStatus.choices, default=CourseStatus.ACTIVE)
    owner_instructor = models.ForeignKey('InstructorProfile', models.DO_NOTHING)
    credits = models.IntegerField(blank=True, null=True)
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
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    course = models.ForeignKey(Course, models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'enrollment'
        unique_together = (('student', 'course'),)


class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', models.DO_NOTHING)
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

    class Meta:
        managed = True
        db_table = 'lesson'


class LessonAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    points = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'lesson_assignment'


class LessonClassroom(models.Model):
    class Day(models.TextChoices):
        MONDAY = "Monday", "MONDAY"
        TUESDAY = "Tuesday", "TUESDAY"
        WEDNESDAY = "Wednesday", "WEDNESDAY"
        THURSDAY = "Thursday", "THURSDAY"
        FRIDAY = "Friday", "FRIDAY"
        SATURDAY = "Saturday", "SATURDAY"
        SUNDAY = "Sunday", "SUNDAY"
    lesson_classroom_id =  models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    classroom = models.ForeignKey(Classroom, models.DO_NOTHING)
    #session_times_json = models.JSONField(blank=True, null=True)
    day_of_week = models.CharField(blank=True, null=True, choices=Day.choices, default=Day.MONDAY)
    time_start = models.TimeField(default=dtime(0, 0))
    time_end   = models.TimeField(default=dtime(0, 0))
    duration_minutes = models.IntegerField(blank=True, null=True)
    linked_at = models.DateTimeField(auto_now_add=True)
    director = models.ForeignKey(InstructorProfile, models.DO_NOTHING)


    class Meta:
        managed = True
        db_table = 'lesson_classroom'

    def save(self, *args, **kwargs):
        if self.time_start and self.time_end:
             delta = datetime.combine(date.min, self.time_end) - datetime.combine(date.min, self.time_start)
             self.duration_minutes = int(delta.total_seconds() / 60)
        super().save(*args, **kwargs)

    
class ClassroomEnrollment(models.Model):
    lesson_classroom = models.ForeignKey(LessonClassroom, models.DO_NOTHING)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom_enrollment'
        unique_together = (('lesson_classroom', 'student'),)


class LessonEnrollment(models.Model):
    lesson_enrollment_id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        managed = True
        db_table = 'lesson_enrollment'
        unique_together = (('lesson', 'student'),)


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

