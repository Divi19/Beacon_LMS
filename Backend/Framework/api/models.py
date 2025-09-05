from django.db import models

# Create your models here.
class Course(models.Model):
    course_title = models.CharField(max_length=250)
    course_id = models.CharField(max_length=25, unique=True)
    course_credits = models.IntegerField()
    course_director = models.CharField(max_length=50)
    course_description = models.TextField(max_length=1000)
    