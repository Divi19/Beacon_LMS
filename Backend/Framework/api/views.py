from django.shortcuts import render, redirect
from .forms import CoursesForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CourseSerializer
<<<<<<< HEAD
from django.http import JsonResponse
from .models import User, Course, Enrollment
=======
from .models import Course
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
>>>>>>> 97c0bb05ad1411819ba9020c39f385e5c21035cc

#For getting list of courses
@method_decorator(csrf_exempt, name='dispatch')
class FrontendView(APIView):
    permission_classes = [AllowAny]
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

<<<<<<< HEAD


def db_health(request):
    return JsonResponse({
        "users": User.objects.count(),
        "courses": Course.objects.count(),
        "enrollments": Enrollment.objects.count(),
        "ok": True
    })
=======
#For getting a single course, no list and no post method
@method_decorator(csrf_exempt, name='dispatch')
class FrontendDetailView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        courses = Course.objects.get(course_id=pk)
        output = {"course_title": courses.course_title,
                   "course_id": courses.course_id,
                   "course_credits": courses.course_credits,
                   "course_director": courses.course_director,
                   "course_description": courses.course_description}
        return Response(output)

>>>>>>> 97c0bb05ad1411819ba9020c39f385e5c21035cc
