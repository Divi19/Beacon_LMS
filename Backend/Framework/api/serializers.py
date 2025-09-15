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
    """
    Receiving json about user and parsing it in GET
    """
    class Meta:
        model = User 
        fields = ['user_id', 'email', 'password_hash', 'role', 'created_at']
        extra_kwargs = { #Extra sttings for certain fiels 
            'email': {'write_only': True}, # Never send email hash back to clients
            'password_hash': {'write_only': True}, # Never send password hash back to clients
            'created_at': {'read_only': True}, # created_at is read-only
        }

class InstructorSerializer(serializers.ModelSerializer):
    """
    Receiving json about instructors and parsing it (including nested user json) in GET
    """
    user = UserSerializer() 
    class Meta:
        model = InstructorProfile
        fields = ["instructor_profile_id", "user", "full_name", "staff_no"]

class LoginSerializer(serializers.ModelSerializer):
    """
    Json parsing for login purposes in POST
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    
class CourseSerializer(serializers.ModelSerializer):
    """
    Json parsing for courses showing and creation in POST and GET
    """
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source='owner_instructor', queryset=InstructorProfile.objects.all(), write_only=True
        )
    Instructor = InstructorSerializer()

    class Meta:
        model = Course
        fields = ["course_id", "code", "title", "status", "owner_instructor", "credits", "director", "description"]
        read_only_fields = ["owner_instructor"]  

    #Creating a course from a form, fields in validated_data.
    def create(self, validated_data): 
        """
        POST function for course creation. Due to no nested fields, no need for external serializers
        """
        request = self.context.get("request") #read the current request (who is requesting?)
        if "owner_instructor" not in validated_data and request and hasattr(request, "user"):
            #In case validated data isn't storing owner_instructor, but user instead
            try:
                #Grab instructor based on user field
                owner = InstructorProfile.objects.get(user=request.user)
                validated_data["owner_instructor"] = owner
            except InstructorProfile.DoesNotExist:
                pass
        return Course.objects.create(**validated_data)


class StudentSerializer(serializers.ModelSerializer):
    """
    Json parsing for student creation (registration) and reading in POST and GET
    """
    #password for student creation
    email = serializers.EmailField(write_only = True)
    password = serializers.CharField(write_only = True) 
    user = UserSerializer() 

    class Meta:
        model = StudentProfile
        fields = ['student_profile_id', 'user', 'full_name', 'student_no', 'locked_at', 'password']
        read_only_fields = ['student_profile_id', 'student_no']

    #during post 
    def create(self, validated_data):
        """
        POST student creation (registration), invoked implicitly using .save() in views
        """
        #validated data contains email and password 
        email = validated_data.pop('email', None) 
        role = validated_data.pop('role', 'student')
        raw_pwd = validated_data.pop('password')
        
        user = User.objects.create(
            email = email,
            password_hash=make_password(raw_pwd), #Hash the plain password 
            role=role #Set the role or default to student 
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
