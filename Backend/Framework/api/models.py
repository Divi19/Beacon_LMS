from django.db import models
from django.core.exceptions import ValidationError


DAY_CHOICES = [
    ('Monday','Monday'), ('Tuesday','Tuesday'), ('Wednesday','Wednesday'),
    ('Thursday','Thursday'), ('Friday','Friday'), ('Saturday','Saturday'),
    ('Sunday','Sunday'),
]

# -------------------- USERS --------------------
class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True, max_length=255)          
    password_hash = models.CharField(max_length=255)             
    role = models.CharField(max_length=50)                         
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'users'  # matches SQL

    @property
    def is_authenticated(self):
        return True


# -------------------- PROFILES --------------------
class InstructorProfile(models.Model):
    instructor_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True)
    full_name = models.CharField(max_length=255)                     
    staff_no = models.CharField(unique=True, max_length=50)          

    class Meta:
        managed = True
        db_table = 'instructor_profile'


class StudentProfile(models.Model):
    student_profile_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True)
    full_name = models.CharField(max_length=255)                     
    student_no = models.CharField(unique=True, max_length=50)        
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'student_profile'

