from rest_framework import serializers
from .models import Course, User, StudentProfile 

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

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

class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Containing nested student and course (FK). StudentSerializer and CourseSerializer used to parse nested info
    """
    student = StudentSerializer(read_only = True)
    course = CourseSerializer()
    class Meta:
        model = Course
        fields = ['enrollment_id', 'student', 'course', 'enrolled_at']


