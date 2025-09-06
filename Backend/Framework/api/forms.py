from django import forms
from .models import Course

class CoursesForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = '__all__'
        db_table = 'courses'