from django.shortcuts import render, redirect
from .forms import CoursesForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CourseSerializer
from .models import Course

# Create your views here.
def course_creation(request):
    if request.method == 'POST':
        form = CoursesForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('create_courses')
    else:
        form = CoursesForm()

    return render(request, 'course.html', {'form' : form})

class FrontendView(APIView):
    def get(self, request):
        courses = Course.objects.all()
        output = [{"course_title": course.course_title,
                   "course_id": course.course_id,
                   "course_credits": course.course_credits,
                   "course_director": course.course_director,
                   "course_description": course.course_description}
                   for course in courses]
        return Response(output)
    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
