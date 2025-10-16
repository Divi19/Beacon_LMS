from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(Course)
admin.site.register(StudentProfile)
admin.site.register(InstructorProfile)
admin.site.register(User)
admin.site.register(Enrollment)
admin.site.register(Classroom)
admin.site.register(ClassroomEnrollment)
admin.site.register(Lesson)
admin.site.register(LessonEnrollment)
admin.site.register(LessonPrerequisite)
admin.site.register(LessonClassroom)
admin.site.register(LessonAssignment)
admin.site.register(LessonReading)
admin.site.register(StudentAssignment)
admin.site.register(StudentReading)
admin.site.register(AdminProfile)

