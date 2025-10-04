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
import random
import string

def generate_custom_id():
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    digits = ''.join(random.choices(string.digits, k=4))
    return f"{letters}{digits}"

"""
Users 
"""
class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True, max_length=255, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50,  blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'user'

    @property 
    def is_authenticated(self):
        return True


class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True)
    full_name = models.CharField(max_length=255,null=True, blank=True)
    staff_no = models.CharField(unique=True, max_length=50,null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'instructor_profile'


class StudentProfile(models.Model):
    student_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True)
    first_name = models.CharField(max_length=255, blank=True, null=True )
    last_name = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    locked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'student_profile'

"""
Courses
"""
class Course(models.Model):
    class CourseStatus(models.TextChoices):
        ACTIVE = "Active", "ACTIVE"
        INACTIVE = "Inactive", "INACTIVE"
        DRAFT = "Draft", "DRAFT"
    
    course_id = models.CharField(primary_key=True, max_length=6, unique=True, default=generate_custom_id, editable=True)
    title = models.CharField(max_length=255,null=True, blank=True)
    status = models.CharField(max_length=50, choices=CourseStatus.choices, default=CourseStatus.ACTIVE)
    owner_instructor = models.ForeignKey('InstructorProfile', models.DO_NOTHING,  null=True, blank=True,)
    credits = models.PositiveIntegerField(blank=False, null=True, default=30,  editable=False,)
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


class CourseDraft(models.Model):
    draft_id = models.CharField(primary_key=True, max_length=6, unique=True, default=generate_custom_id, editable=False)
    course = models.ForeignKey(Course, models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    outline_json = models.JSONField(blank=True, null=True)
    created_by = models.ForeignKey('InstructorProfile', models.DO_NOTHING, null=True, blank=True,db_column='created_by')
    is_selected = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'course_draft'

    def save(self, *args, **kwargs):
        if not self.draft_id:
            # ensure uniqueness: regenerate if collision occurs
            new_id = generate_custom_id()
            while CourseDraft.objects.filter(draft_id=new_id).exists():
                new_id = generate_custom_id()
            self.draft_id = new_id
        super().save(*args, **kwargs)


class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING, blank=True, null=True)
    course = models.ForeignKey(Course, models.DO_NOTHING, blank=True, null=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'enrollment'
        unique_together = (('student', 'course'),)

"""
Lessons 
"""

class Lesson(models.Model):
    class LessonStatus(models.TextChoices):
        ACTIVE = "Active", "ACTIVE"
        INACTIVE = "Inactive", "INACTIVE"
        ARCHIVED = "Archived", "ARCHIVED"
    class DurationWeeks(models.IntegerChoices):
        TWO = 2, "2"
        THREE = 3, "3"
        FOUR = 4 , "4"
    lesson_id =  models.CharField(primary_key=True, max_length=6, unique=True, default=generate_custom_id, editable=False)
    course = models.ForeignKey(Course, models.DO_NOTHING, null=True, blank=True,)
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    credits = models.PositiveIntegerField(blank=True, null=True, default=0)
    objectives = models.TextField(blank=True, null=True)
    duration_weeks = models.PositiveIntegerField(blank=True, null=True, choices=DurationWeeks.choices, default=DurationWeeks.FOUR)
    status = models.CharField(max_length=50, choices=LessonStatus.choices, default=LessonStatus.ACTIVE)
    #is_active = models.BooleanField(null=True, blank=True, default=True)
    designer_id = models.ForeignKey(InstructorProfile, models.DO_NOTHING,null=True, blank=True, db_column='created_by')
    created_by = models.ForeignKey(InstructorProfile, models.DO_NOTHING,null=True, blank=True, db_column='created_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'lesson'

    def save(self, *args, **kwargs):
        if not self.lesson_id:
            # ensure uniqueness: regenerate if collision occurs
            new_id = generate_custom_id()
            while Lesson.objects.filter(lesson_id=new_id).exists():
                new_id = generate_custom_id()
            self.lesson_id = new_id
        super().save(*args, **kwargs)


class LessonEnrollment(models.Model):
    id = models.BigAutoField(primary_key=True) 
    #pk = models.CompositePrimaryKey('lesson_id', 'student_id')
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING, null=True, blank=True,)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING, null=True, blank=True,)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'lesson_enrollment'


class LessonPrerequisite(models.Model):
    id = models.BigAutoField(primary_key=True) 
    #lesson_id = models.ForeignKey(Lesson, models.DO_NOTHING)
    #pk = models.CompositePrimaryKey('lesson_id', 'prereq_lesson_id')
    lesson = models.ForeignKey(Lesson, models.DO_NOTHING, null=True, blank=True,)
    prereq_lesson = models.ForeignKey(Lesson, models.DO_NOTHING, null=True, blank=True, related_name='lessonprerequisite_prereq_lesson_set')

    class Meta:
        managed = True
        db_table = 'lesson_prerequisite'
        constraints = [
            models.UniqueConstraint(
                fields=["lesson", "prereq_lesson"], name="uq_lesson_prereq"
            )
        ]

"""
Classroom
"""
class Classroom(models.Model):
    
    classroom_id = models.CharField(
        primary_key=True, max_length=6, unique=True,
        default=generate_custom_id, editable=False
    )
 
    lesson = models.ForeignKey("Lesson", models.DO_NOTHING, blank=True, null=True)
    instructor = models.ForeignKey("InstructorProfile", models.DO_NOTHING, blank=True, null=True)

    duration_minutes = models.PositiveIntegerField(blank=True, null=True)  # int is plenty
    is_active = models.BooleanField(default=True)
    capacity = models.PositiveIntegerField(
        default=10, validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    day_of_week = models.CharField(max_length=20, blank=True, null=True)
    time_start = models.TimeField(blank=True, null=True)
    time_end = models.TimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        managed = True
        db_table = "classroom"
        unique_together = (("lesson", "day_of_week", "time_start", "time_end"),)

    def save(self, *args, **kwargs):
        if not self.classroom_id:
            new_id = generate_custom_id()
            while Classroom.objects.filter(classroom_id=new_id).exists():
                new_id = generate_custom_id()
            self.classroom_id = new_id #weirdass why not reflected??
        super().save(*args, **kwargs)

class ClassroomEnrollment(models.Model):
    id = models.BigAutoField(primary_key=True) 
    #pk = models.CompositePrimaryKey('classroom_id', 'student_id')
    classroom = models.ForeignKey(Classroom, models.DO_NOTHING,null=True, blank=True,)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING,null=True, blank=True,)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom_enrollment'

