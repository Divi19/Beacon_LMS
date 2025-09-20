# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.utils import timezone




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
    full_name = models.CharField(max_length=255)
    student_no = models.CharField(unique=True, max_length=50)
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

    course_id = models.AutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=20,null=True, blank=True)
    title = models.CharField(max_length=255,null=True, blank=True)
    status = models.CharField(max_length=50, choices=CourseStatus.choices, default=CourseStatus.ACTIVE)
    owner_instructor = models.ForeignKey('InstructorProfile', models.DO_NOTHING,  null=True, blank=True,)
    credits = models.PositiveIntegerField(blank=False, null=True, default=30, editable=False)
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'course'


class CourseDraft(models.Model):
    draft_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    outline_json = models.JSONField(blank=True, null=True)
    created_by = models.ForeignKey('InstructorProfile', models.DO_NOTHING, null=True, blank=True,db_column='created_by')
    is_selected = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'course_draft'


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
    lesson_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, models.DO_NOTHING, null=True, blank=True,)
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    objectives = models.TextField(blank=True, null=True)
    duration_weeks = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=LessonStatus.choices, default=LessonStatus.ACTIVE)
    #is_active = models.BooleanField(null=True, blank=True, default=True)
    created_by = models.ForeignKey(InstructorProfile, models.DO_NOTHING,null=True, blank=True, db_column='created_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'lesson'


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

"""
Classroom
"""
class Classroom(models.Model):
    id = models.BigAutoField(primary_key=True) 
    lesson = models.ForeignKey('Lesson', models.DO_NOTHING, blank=True, null=True)
    instructor = models.ForeignKey('InstructorProfile', models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255,blank=True, null=True)
    duration_weeks = models.PositiveIntegerField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True,default=True)
    capacity = models.PositiveIntegerField(blank=False, null=True, default=10, editable=False)
    day_of_week = models.CharField(max_length=20, blank=True, null=True)
    time_start = models.TimeField(blank=True, null=True)
    time_end = models.TimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom'
        unique_together = (('lesson', 'day_of_week', 'time_start', 'time_end'),)


class ClassroomEnrollment(models.Model):
    id = models.BigAutoField(primary_key=True) 
    #pk = models.CompositePrimaryKey('classroom_id', 'student_id')
    classroom = models.ForeignKey(Classroom, models.DO_NOTHING,null=True, blank=True,)
    student = models.ForeignKey('StudentProfile', models.DO_NOTHING,null=True, blank=True,)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom_enrollment'

