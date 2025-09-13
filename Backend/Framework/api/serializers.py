from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password

"""

class StudentSerializer(serializers.ModelSerializer):
    #receives primary id and translates into real course
    course_ids = serializers.PrimaryKeyRelatedField(
        many=True, source="courses", queryset=Course.objects.all(),
        write_only=True, required=False
    )
    #Nested models 
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = ["student_profile_id", "full_name", "student_no", "courses", "course_ids"]
        read_only_fields = ["student_profile_id"]

class InstructorSerializer(serializers.ModelSerializer):
    #receives primary id and translates into real course
    course_ids = serializers.PrimaryKeyRelatedField(
        many=True, source="courses", queryset=Course.objects.all(),
        write_only=True, required=False
    )
    #Nested models 
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Instructor
        fields = ["instructor_profile_id", "full_name", "instructor_email", "password_hash", "course_ids"]
        read_only_fields = ["instructor_prodile_id"] #automated key
"""


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User 
        fields = ['email', 'password_hash', 'role', 'created_at']
        extra_kwargs = { #Extra sttings for certain fiels 
            'password_hash': {'write_only': True}, # Never send password hash back to clients
            'created_at': {'read_only': True}, # created_at is read-only
        }

class InstructorSerializer(serializers.ModelSerializer):
    user = UserSerializer() 
    class Meta:
        model = InstructorProfile
        fields = ["instructor_profile_id", "user", "full_name", "staff_no"]
        
    
class CourseSerializer(serializers.ModelSerializer):
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source='instructor', queryset=InstructorProfile.objects.all(), write_only=True
        )
    Instructor = InstructorSerializer()

    class Meta:
        model = Course
        fields = ["course_id", "code", "title", "status", "owner_instructor", "credits", "director", "description"]
        read_only_fields = ["owner_instructor"]  

    def create(self, validated_data): 
        request = self.context.get("request") #read the current request 
        instructor =  InstructorProfile.objects.get(user = request.user) #match user info in instructors 
        validated_data["owner_instructor"] = instructor
        return  Course.objects.create(**validated_data) #Unpacking again



class StudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only = True) 
    user = UserSerializer() 
    class Meta:
        model = StudentProfile
        fields = ['student_profile_id', 'user', 'full_name', 'student_no', 'locked_at']
        read_only_fields = ['student_profile_id', 'student_no']

    #during post 
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        raw_pwd = validated_data.pop('password')
        user = User.objects.create(
            email = user_data['email'],
            password_hash=make_password(raw_pwd), #Hash the plain password 
            role=user_data.get('role', 'student'), #Set the role or default to student 
        )
        student = StudentProfile.objects.create(
            user=user,
             **validated_data #unpack the rest of the validated data
        )
        return student 

class EnrollmentSerializer(serializers.ModelSerializer):
    student_profile_id = serializers.PrimaryKeyRelatedField(
        source='student', queryset=StudentProfile.objects.all(), write_only=True
    ) #Receive a list of ids which get translated to real student object
    course_id = serializers.PrimaryKeyRelatedField(
        source='course', queryset=Course.objects.all(), write_only=True
    ) #Receive a list of ids which get translated to real course object

    student = StudentSerializer(read_only = True)
    course = CourseSerializer(read_only = True)

    class Meta:
        model = Enrollment
        fields = ['enrollment_id', 'student', 'course', 'enrolled_at']

    #post during creation
    def create(self, validated_data):
        student = validated_data.pop('student')
        course = validated_data.pop('course')
        #see if object already exists 
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError(
                "This student is already enrolled in this course."
            )
        if course.status != "Active":
            raise serializers.ValidationError(
                "This course is current inactive."
            )

        enrollment = Enrollment.objects.create(
             **validated_data #unpack the rest of the validated data
        )
        return enrollment 
