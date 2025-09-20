from django.db import models
from django.core.exceptions import ValidationError

# ----- Constants to mirror CHECK(day_of_week ...) -----
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
    student_no = models.CharField(unique=True, max_length=50)        # NOT NULL
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'student_profile'


# -------------------- COURSE --------------------
class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=20)             
    title = models.CharField(max_length=255)                        
    status = models.CharField(max_length=50)                       
    owner_instructor = models.ForeignKey(
        InstructorProfile,
        on_delete=models.PROTECT                                    
    )
    credits = models.IntegerField(null=True, blank=True)             
    director = models.CharField(max_length=50, null=True, blank=True) 
    description = models.TextField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'course'


class CourseDraft(models.Model):
    draft_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.DO_NOTHING, null=True, blank=True)
    title = models.CharField(max_length=255)                         
    outline_json = models.JSONField(null=True, blank=True)           
    created_by = models.ForeignKey(InstructorProfile, on_delete=models.DO_NOTHING)  
    is_selected = models.BooleanField(default=False)                 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'course_draft'


# -------------------- LESSON --------------------
class Lesson(models.Model):
    lesson_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.DO_NOTHING) 
    title = models.CharField(max_length=255)                        
    description = models.TextField(null=True, blank=True)
    objectives = models.TextField(null=True, blank=True)
    duration_weeks = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=50, default='draft')        
    is_active = models.BooleanField(default=True)                  
    created_by = models.ForeignKey(
        InstructorProfile,
        on_delete=models.DO_NOTHING,
        db_column='created_by'
    )                                                            
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'lesson'


class LessonPrerequisite(models.Model):
    id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(
        Lesson, on_delete=models.DO_NOTHING, related_name='prereqs_for'
    )
    prereq_lesson = models.ForeignKey(
        Lesson, on_delete=models.DO_NOTHING, related_name='is_prereq_of'
    )

    class Meta:
        managed = True
        db_table = 'lesson_prerequisite'
        unique_together = (('lesson', 'prereq_lesson'),)           

    def clean(self):
        # enforce CHECK (lesson_id <> prereq_lesson_id)
        if self.lesson_id and self.prereq_lesson_id and self.lesson_id == self.prereq_lesson_id:
            raise ValidationError("A lesson cannot be a prerequisite of itself.")


# -------------------- CLASSROOM --------------------
class Classroom(models.Model):
    id = models.AutoField(primary_key=True)                        
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)      
    instructor = models.ForeignKey(InstructorProfile, on_delete=models.DO_NOTHING)
    title = models.CharField(max_length=255)                         
    duration_weeks = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)                     
    capacity = models.IntegerField(null=True, blank=True)             
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES) 
    time_start = models.TimeField()                                
    time_end = models.TimeField()                                    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom'
        unique_together = (('lesson', 'day_of_week', 'time_start', 'time_end'),)

    def clean(self):
        if self.time_start and self.time_end and not (self.time_start < self.time_end):
            raise ValidationError("time_start must be < time_end")


# -------------------- ENROLLMENTS --------------------
class LessonEnrollment(models.Model):
    id = models.AutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.DO_NOTHING)
    student = models.ForeignKey(StudentProfile, on_delete=models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'lesson_enrollment'
        unique_together = (('lesson', 'student'),)                   


class ClassroomEnrollment(models.Model):
    id = models.AutoField(primary_key=True)
    classroom = models.ForeignKey(Classroom, on_delete=models.DO_NOTHING)
    student = models.ForeignKey(StudentProfile, on_delete=models.DO_NOTHING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'classroom_enrollment'
        unique_together = (('classroom', 'student'),)              


class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(StudentProfile, on_delete=models.DO_NOTHING, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.DO_NOTHING, null=True, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'enrollment'
        unique_together = (('student', 'course'),)
