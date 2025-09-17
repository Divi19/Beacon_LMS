from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import authenticate
from django.db.models.functions import Lower



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

class LoginSerializer(serializers.Serializer):
    """
    Json parsing for login purposes in POST
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs['email']
        password = attrs['password']
        user = User.objects.filter(email__iexact=email).first()
        generic_error = serializers.ValidationError("Invalid email or password.")
        if user is None:
            raise generic_error
        if not user.is_active: 
            #check is user is deactivated 
            raise generic_error
        if not (password == user.password_hash):
            raise generic_error

        attrs['user'] = user
        return attrs


class CourseSerializer(serializers.ModelSerializer):
    """
    Json parsing for courses showing and creation in POST and GET
    """
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source='owner_instructor', queryset=InstructorProfile.objects.all(), write_only=True
        )

    class Meta:
        model = Course
        fields = ["code", "title", "status", "owner_instructor", "owner_instructor_id", "credits", "description"]
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
    course_id = serializers.PrimaryKeyRelatedField(
        source='course', queryset=Course.objects.all(), write_only=True
    ) #Receive an id which get translated to real course object

    class Meta:
        model = Enrollment
        fields = ['enrollment_id', 'course_id', 'enrolled_at']

    #post during creation
    def create(self, validated_data):
        student = self.context.get('student')
        if student is None:
            raise serializers.ValidationError("Serializer context must include 'student'.")

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
            student = student,
            course = course,
            **validated_data #unpack the rest of the validated data
        )
        return enrollment 
