from rest_framework import serializers
from .models import * 
from django.contrib.auth.models import User 

class ReactSerializer(serializers.ModelSerializer):
    class Meta: 
        model = ReactRegister
        fields = ['student_name', 'student_email', 'course']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User 
        fields = ['email', 'password_hash', 'role', 'created_at']

class StudentSerializer(serializers.ModelSerializer):
    """
    Containing nested user (FK). UserSerializer used to parse user info
    """
    password = serializers.CharField(write_only = True)
    user = UserSerializer() 
    class Meta:
        model = StudentProfile
        fields = ['student_profile_id', 'user', 'full_name', 'student_no', 'locked_at']
    
    def create(self, validated_data):
        student = User(
            name = validated_data['full_name'],
            email = validated_data['email'],
            student_no = validated_data['student_no']
        )
        student.set_password(validated_data['password_hash'])
        student.save()


class CourseSerializer(serializers.ModelSerializer):
    """
    TODO: Course Instructor (FK) information 
    """
    class Meta:
        model = Course
        fields = ['course_id', 'code', 'title', 'status']

class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Containing nested student and course (FK). StudentSerializer and CourseSerializer used to parse nested info
    """
    student = StudentSerializer(read_only = True)
    course = CourseSerializer()
    class Meta:
        model = Course
        fields = ['enrollment_id', 'student', 'course', 'enrolled_at']




class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """
    Handles serializing course registraitons
    """
    
