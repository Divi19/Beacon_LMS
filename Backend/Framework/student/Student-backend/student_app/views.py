
from django.shortcuts import render

#accessing local files
from . models import * 
from . serializer import * 

#rest 
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny


def Home(request):
    return render(request, 'index.html')

class RegisterView(APIView):
    """
    Getting request
    """
    def get(self, request):
        output_list = [{"student": obj.student_name, "student_email": obj.student_email, "course": obj.course } 
                       for obj in ReactRegister.objects.all()]
        return Response(output_list)

    def post(self, request):
        serializer = ReactSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
    

@api_view(['POST']) #decorator takes a list of HTTP methods that view should respond to
class StudentRegistration(APIView):
    """
    Student registration
    """
    def register(self, request):
        #serialize request data from user and store in serializer
        serializer = StudentSerializer(data=request.user) 
        if serializer.is_valid(): 
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.error)

@api_view(['POST']) 
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    return Response({"authenticated": True})
        
@permission_classes([IsAuthenticated])
class StudentLogin(APIView):
    """
    Student registration
    """
    def get(self, request):
        return None
 
@api_view(['GET', 'POST']) 
class CourseEnrollment(APIView):
    """
    Couse enrollment
    """
    queryset = Enrollment.objects.all() #Set of all enrolment objects 
    serializer_class = EnrollmentSerializer() #converting to json

    #Client sends self information and chosen course information
    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student') #getting payload
        course_id = request.data.get('course') #getting payload 
    
        #Check if student or course exist
        try:
            student = StudentProfile.objects.get(pk=student_id)
            course = Course.objects.get(pk=course_id)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)

        # Check if already enrolled
        if Enrollment.objects.filter(student=student, course=course).exists():
            return Response({'error': 'Already enrolled'}, status=400)

        #create new enrollment project 
        enrollment = Enrollment.objects.create(student=student, course=course)
        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=201)
        
