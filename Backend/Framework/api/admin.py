from django.contrib import admin
from .models import Course, Student, Lesson
# Register your models here.
class LessonInLine(admin.TabularInline):
    model = Lesson
    extra = 1

class CourseAdmin(admin.ModelAdmin):
    inlines = [LessonInLine]

admin.site.register(Course, CourseAdmin)
admin.site.register(Student)
