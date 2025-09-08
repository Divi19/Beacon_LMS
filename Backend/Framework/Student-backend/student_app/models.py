from django.db import models

#CASCADING: Delete this object’s dependent records automatically if the referenced object is deleted.
# Create your models here.
class ReactRegister(models.Model): 
    #Accessing the database though
    student_profile_id = models.CharField()
    student_email = models.CharField()
    course = models.CharField()

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


class Course(models.Model):
    """
    This class stores course information where:
    - course_id (PK): auto-increment 
    - code (UK): each course code must be unique
    - owner_instructore (FK): connecting to instructor profile model. Awaiting Divi. 
    """
    course_id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    #owner_instructor = models.ForeignKey(InstructorProfile, on_delete=models.CASCADE)

    def __str__(self):
        return self.title


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
