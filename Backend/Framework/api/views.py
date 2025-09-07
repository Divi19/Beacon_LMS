from django.shortcuts import render, redirect
from .forms import CoursesForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CourseSerializer
from django.http import JsonResponse
from .models import User, Course, Enrollment

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
        output = [{
            "course_title":  c.title,        
            "course_id":     c.code,        
            "course_credits": c.credits,    
            "course_director": c.director,   
            "course_description": c.description,  
        } for c in courses]
        return Response(output)

    
    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)



def db_health(request):
    return JsonResponse({
        "users": User.objects.count(),
        "courses": Course.objects.count(),
        "enrollments": Enrollment.objects.count(),
        "ok": True
    })
