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
    
class Lesson(models.Model):
    lesson_title = models.CharField(max_length=250)
    lesson_id = models.CharField(primary_key=True, max_length=500, unique=True)
    lesson_credits = models.IntegerField()
    lesson_duration = models.IntegerField(default=0)
    lesson_description = models.TextField(max_length=1000)
    lesson_objective = models.TextField(max_length=1000)
    lesson_prerequisite = models.TextField(max_length=500)
    courses = models.ForeignKey(Course, related_name="lessons", on_delete=models.CASCADE)
    
class Student(models.Model):
    student_profile_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=255)
    student_no = models.CharField(max_length=50, unique=True)
    courses = models.ManyToManyField(Course, related_name="students", blank=True) 

    def __str__(self):
        return f"{self.student_profile_id}: {self.full_name}"




#class CourseDraft(models.Model):
#    draft_id = models.AutoField(primary_key=True)
#    course = models.ForeignKey(Course, db_column="course_id", null=True, on_delete=models.SET_NULL)
#    title = models.CharField(max_length=255)
#    outline_json = models.JSONField(null=True, blank=True)
#    created_by = models.ForeignKey(InstructorProfile, db_column="created_by", on_delete=models.DO_NOTHING)
#    is_selected = models.BooleanField(default=False)
#    created_at = models.DateTimeField(auto_now_add=True)

#    class Meta:
#        db_table = "course_draft"
#        managed = False

#class Enrollment(models.Model):
#    enrollment_id = models.AutoField(primary_key=True)
#    student = models.ForeignKey(StudentProfile, db_column="student_id", on_delete=models.DO_NOTHING)
#    course = models.ForeignKey(Course, db_column="course_id", on_delete=models.DO_NOTHING)
#    enrolled_at = models.DateTimeField(auto_now_add=True)

#    class Meta:
#        db_table = "enrollment"
#        managed = False
#        unique_together = (("student", "course"),)
