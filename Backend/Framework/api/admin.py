from django.contrib import admin
from .models import *


admin.site.register(Course)
admin.site.register(Lesson)
admin.site.register(CourseDraft)
admin.site.register(StudentProfile)
admin.site.register(InstructorProfile)
admin.site.register(User)
admin.site.register(Enrollment)

admin.site.register(Classroom)
admin.site.register(ClassroomEnrollment)

admin.site.register(LessonEnrollment)
admin.site.register(LessonPrerequisite)

