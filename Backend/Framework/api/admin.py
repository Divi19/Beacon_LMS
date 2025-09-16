from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(Course)
admin.site.register(StudentProfile)
admin.site.register(InstructorProfile)
admin.site.register(User)
admin.site.register(Enrollment)