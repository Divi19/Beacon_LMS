from django import forms
from .models import *

class CoursesForm(forms.ModelForm):
    """
    Form for course creation
    """
    class Meta:
        model = Course
        fields = '__all__'

