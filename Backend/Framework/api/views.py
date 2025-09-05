from django.shortcuts import render, redirect
from .forms import CoursesForm

# Create your views here.
def course_creation(request):
    # form = CoursesForm()
    if request.method == 'POST':
        form = CoursesForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('create_courses')
    else:
        form = CoursesForm()

    return render(request, 'course.html', {'form' : form})
