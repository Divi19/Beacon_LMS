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
    
class User(models.Model):
    """
    This class stores user (attributes exising in both instructors and students) information where:
    - user_id (PK): auto increment 
    - email (UK): ensure no similar emails
    - created_at: auto timestamp during user creation
    """
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email 


class StudentProfile(models.Model):
    """
    This class stores student information where:
    - student_profile_id (PK): auto increment
    - user (FK): connecting to the User model 
    - student_no (UK): student number must be unique
    - locked_at: unsure what this is for, but auto time stamp
    """
    student_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    student_no = models.CharField(max_length=50, unique=True)
    locked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

class Enrollment(models.Model):
    """
    This class stores the enrollment information where:
    - enrollment_id (UK): auto-increment 
    - student (FK): linking to student model
    - course (FK): linking to course model
    - enrolled_at: auto time stamp
    """
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE) 
    enrolled_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
         return f"student: {self.student} ; enrolled in: {self.course}"
