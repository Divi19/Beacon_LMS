from django.db import models

# Create your models here.
class Course(models.Model):
    course_title = models.CharField(max_length=250)
    course_id = models.CharField(max_length=25, unique=True)
    course_credits = models.IntegerField()
    course_director = models.CharField(max_length=50)
    course_description = models.TextField(max_length=1000)

    def __str__(self):
        return f"{self.course_id}: {self.course_title}"
    
# Backend/Framework/api/models.py
from django.db import models

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users"
        managed = False  # keep Django from altering your hand-crafted schema

class StudentProfile(models.Model):
    student_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, db_column="user_id", on_delete=models.DO_NOTHING)
    full_name = models.CharField(max_length=255)
    student_no = models.CharField(max_length=50, unique=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "student_profile"
        managed = False

class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, db_column="user_id", on_delete=models.DO_NOTHING)
    full_name = models.CharField(max_length=255)
    staff_no = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "instructor_profile"
        managed = False

class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    owner_instructor = models.ForeignKey(
        InstructorProfile, db_column="owner_instructor_id", on_delete=models.DO_NOTHING
    )
    credits = models.IntegerField(null=True, blank=True)
    director = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "course"
        managed = False


class CourseDraft(models.Model):
    draft_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, db_column="course_id", null=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=255)
    outline_json = models.JSONField(null=True, blank=True)
    created_by = models.ForeignKey(InstructorProfile, db_column="created_by", on_delete=models.DO_NOTHING)
    is_selected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "course_draft"
        managed = False

class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(StudentProfile, db_column="student_id", on_delete=models.DO_NOTHING)
    course = models.ForeignKey(Course, db_column="course_id", on_delete=models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "enrollment"
        managed = False
        unique_together = (("student", "course"),)
