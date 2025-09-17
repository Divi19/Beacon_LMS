from django.db import models
from django.core.validators import MaxValueValidator


"""
Models for Postgresql
"""
class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "user"
        managed = True

    def __str__(self):
        return self.email 
    @property
    def is_authenticated(self) -> bool:
        # DRF will treat any authenticated principal as truthy here
        return True
    @property
    def is_anonymous(self) -> bool:
        return False

class StudentProfile(models.Model):
    student_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, db_column="user_id", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    student_no = models.CharField(max_length=50, unique=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "student_profile"
        managed = True

    def __str__(self):
        return f"{self.student_profile_id}: {self.full_name}"
    
class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, db_column="user_id", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    staff_no = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "instructor_profile"
        managed = True

class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=20, unique=True, null=True, blank = True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    owner_instructor = models.ForeignKey(
        InstructorProfile, db_column="owner_instructor_id", on_delete=models.CASCADE
    )
    credits = models.PositiveIntegerField(null=True, blank=True, default=30,validators=[MaxValueValidator(30)] )
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "course"
        managed = True
    
class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(StudentProfile, db_column="student_id", on_delete=models.CASCADE)
    course = models.ForeignKey(Course, db_column="course_id", on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "enrollment"
        managed = True 
        unique_together = (("student", "course"),)
