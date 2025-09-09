from rest_framework import serializers
from .models import Course, Student

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["course_title", "course_id", "course_credits", "course_director", "course_description"]

class StudentSerializer(serializers.ModelSerializer):
    course_ids = serializers.PrimaryKeyRelatedField(
        many=True, source="courses", queryset=Course.objects.all(),
        write_only=True, required=False
    )
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = ["student_profile_id", "full_name", "student_no", "courses", "course_ids"]
        read_only_fields = ["student_profile_id"]

    


"""
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User 
        fields = ['email', 'password_hash', 'role', 'created_at']

class StudentSerializer(serializers.ModelSerializer):
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
    student = StudentSerializer(read_only = True)
    course = CourseSerializer()
    class Meta:
        model = Course
        fields = ['enrollment_id', 'student', 'course', 'enrolled_at']
"""
