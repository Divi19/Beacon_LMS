from django.contrib import admin
from .models import *

# Register your models here.
class LessonInLine(admin.TabularInline):
    model = Lesson
    extra = 1

class CourseAdmin(admin.ModelAdmin):
    inlines = [LessonInLine]

admin.site.register(Course, CourseAdmin)
# admin.site.register(Student)
# Register your models here.

# admin.site.register(Course)
admin.site.register(CourseDraft)
admin.site.register(StudentProfile)
admin.site.register(InstructorProfile)
admin.site.register(User)
admin.site.register(Enrollment)

admin.site.register(Classroom)
admin.site.register(ClassroomEnrollment)

# admin.site.register(Lesson)
# admin.site.register(LessonEnrollment)
# admin.site.register(LessonPrerequisite)

