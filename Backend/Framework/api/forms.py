from django import forms
from .models import Course, Instructor

class CoursesForm(forms.ModelForm):
    """
    Form for course creation
    """
    class Meta:
        model = Course
        fields = '__all__'
    

class InstructorsLoginForm(forms.ModelForm):
    """
    Form for Instructors Login 
    """
    #Masking password inputs 
    password_hash = forms.CharField(widget=forms.PasswordInput)
    class Meta:
        model = Instructor 
        fields = ("email", "password_hash")
