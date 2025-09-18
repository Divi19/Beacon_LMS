from django.db import models
from django.db.models import Q, CheckConstraint

"""
Models for Postgresql
"""
class User(models.Model):
    user_id = models.AutoField(primary_key=True, on_delete = models.CASCADE)
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
    student_profile_id = models.AutoField(primary_key=True, on_delete = models.CASCADE)
    user = models.ForeignKey(User, db_column="user_id")
    full_name = models.CharField(max_length=255)
    student_no = models.CharField(max_length=50, unique=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "student_profile"
        managed = True

    def __str__(self):
        return f"{self.student_profile_id}: {self.full_name}"
    
class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True, on_delete = models.CASCADE)
    user = models.ForeignKey(User, db_column="user_id")
    full_name = models.CharField(max_length=255)
    staff_no = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "instructor_profile"
        managed = True

class Course(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Draft", "Draft"),
        ("Inactive", "Inactive"),
    ]
    course_id = models.AutoField(primary_key=True, on_delete = models.CASCADE)
    code = models.CharField(max_length=20, unique=True, null=True, blank = True)
    title = models.CharField(max_length=255)
    status = models.CharField(choices=STATUS_CHOICES, default="Active", max_length=50)
    owner_instructor = models.ForeignKey(InstructorProfile, db_column="owner_instructor_id")
    credits = models.PositiveIntegerField(null=True, blank=True, default=30, editable=False)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "course"
        managed = True
        constraints = [
            CheckConstraint(check=Q(fixed_30=30), name="fixed_30_is_30"),
        ]
    
class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True, on_delete = models.CASCADE)
    student = models.ForeignKey(StudentProfile, db_column="student_id")
    course = models.ForeignKey(Course, db_column="course_id")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "enrollment"
        managed = True 
        unique_together = (("student", "course"),)

class Lesson(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Draft", "Draft"),
        ("Archived", "Archived"),
    ]
    lesson_id = models.AutoField(primary_key=True, on_delete=models.CASCADE)
    course_id = models.ForeignKey(Course, db_column="course_id")
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    objective = models.TextField(null=True, blank=True)
    duration_weeks = models.PositiveIntegerField()
    credit = models.PositiveIntegerField()
    status = models.CharField(choices=STATUS_CHOICES, default="Active", max_length=50)
    archived_at = models.DateTimeField(null=True, blank=True) #opt to change
    created_by = models.ForeignKey(InstructorProfile, db_column="owner_instructor_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lessons"
        managed = True 
        unique_together = (("lesson_id", "course_id"),)



class Classroom(models.Models):
    classroom_id = models.AutoField(primary_key=True, on_delete = models.CASCADE)
    lesson_id = models.ForeignKey(Lesson, db_column="lesson_id") 
    instructor_id = models.ForeignKey( InstructorProfile, db_column="owner_instructor_id")
    start_date = models.DateTimeField(null=True, blank=True)
    duration_weeks = models.PositiveIntegerField()
    status = models.BooleanField(default=True)
    date_time = models.DateTimeField(null=True, blank=True)
    time_start = models.DateTimeField(null=True, blank=True)
    time_end = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "classroom"
        managed = True 
        unique_together = (("lesson_id", "course_id"),)

class ClassroomEnrollment(models.Models):
    classroom_id = models.ForeignKey(Classroom, db_column="classroom_id")
    student_id = models.ForeignKey(StudentProfile, db_column="student_id")
    enrolled_at = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "classroom_enrollment"
        managed = True
        unique_together = (("classroom_id", "student_id"))