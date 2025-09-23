#rest
from rest_framework import serializers
# from .models import Course, Student, Lesson
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.validators import UniqueTogetherValidator

#djando
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import authenticate
from django.db.models.functions import Lower

#local 
from .models import *

class CourseSerializer(serializers.ModelSerializer):
    """
    Combined CourseSerializer:
    - Exposes all course fields needed by the frontend
    - Automatically sets owner_instructor from the request user
    """
    enrolled_count = serializers.IntegerField(read_only=True)
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source='owner_instructor',
        queryset=InstructorProfile.objects.all(),
        write_only=True,
        required=False  # optional since we'll auto-assign
    )

    class Meta:
        model = Course
        fields = [
            "course_id",
            "code",
            "course_title",
            "course_credits",
            "course_director",
            "course_description",
            "course_number_of_lessons",
            "course_status",
            "enrolled_count",
            "owner_instructor",
            "owner_instructor_id",
        ]
        read_only_fields = ["owner_instructor", "enrolled_count"]

    # def create(self, validated_data):
    #     """
    #     Assign the owner_instructor automatically if not provided.
    #     """
    #     request = self.context.get("request")
    #     if "owner_instructor" not in validated_data and request and hasattr(request, "user"):
    #         try:
    #             owner = InstructorProfile.objects.get(user=request.user)
    #             validated_data["owner_instructor"] = owner
    #         except InstructorProfile.DoesNotExist:
    #             raise serializers.ValidationError("Logged-in user has no instructor profile.")
    #     return super().create(validated_data)

    #Creating a course from a form, fields in validated_data.
    def create(self, validated_data): 
        """
        POST function for course creation. Due to no nested fields, no need for external serializers
        """
        request = self.context.get("request") #read the current request (who is requesting?)
        if "owner_instructor" not in validated_data and request and hasattr(request, "user"):
            #In case validated data isn't storing owner_instructor, but user instead
            #Grab instructor based on user field and add it into the validated data 
            try:
                owner = InstructorProfile.objects.get(user=request.user)
                validated_data["owner_instructor"] = owner
            except InstructorProfile.DoesNotExist:
                pass
        return Course.objects.create(**validated_data)

class LessonSerializer(serializers.ModelSerializer):
    # course_id = serializers.PrimaryKeyRelatedField(
    #     source="courses", queryset=Course.objects.all(),
    #     write_only=True, required=False
    # )
    # courses = CourseSerializer(read_only=True)
    # courses = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    courses = serializers.SlugRelatedField(slug_field = "course_id", queryset = Course.objects.all())

    class Meta:
        model = Lesson
        fields = ["lesson_id", "lesson_title", "lesson_description", "lesson_objectives", "lesson_duration_weeks", "lesson_status", "lesson_created_at", "lesson_created_by", "lesson_prerequisite", "courses"]
        # read_only_fields = ["courses"]

"""
Auth-related serializers
"""
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
    
class CurrentUserSerializer(serializers.ModelSerializer):
    instructor_profile_id = serializers.SerializerMethodField() #An added field
    instructor_full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["user_id", "email", "role", "is_active", "instructor_profile_id", "instructor_full_name"]

    def get_instructor_profile_id(self, obj):
        isInstructor = InstructorProfile.objects.filter(user=obj).only("instructor_profile_id").first()
        return isInstructor.instructor_profile_id if isInstructor else None

    def get_instructor_full_name(self, obj):
        prof = InstructorProfile.objects.filter(user=obj).only("full_name").first()
        return prof.full_name if prof else None

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


"""
Instructor-related serializers
"""
class InstructorSerializer(serializers.ModelSerializer):
    """
    Receiving json about instructors and parsing it (including nested user json) in GET
    """
    user = UserSerializer() 
    class Meta:
        model = InstructorProfile
        fields = ["instructor_profile_id", "user", "full_name", "staff_no"]


"""
Student-related serializers
"""
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
        fields = ['student_profile_id', 'user', 'full_name', 'student_no', 'locked_at', 'password', 'email']
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
            password_hash=raw_pwd, #plain password 
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
        if course.status != Course.CourseStatus.ACTIVE:
            raise serializers.ValidationError(
                "This course is currently inactive."
            )
        
        enrollment = Enrollment.objects.create(
            student = student,
            course = course,
            **validated_data #unpack the rest of the validated data
        )
        return enrollment 

class ClassroomEnrollmentSerializer(serializers.ModelSerializer):
    """
    TODO: Change self.context.get('student') to request = self.context.get("request")
    Use auth later on 
    """
    classroom_id = serializers.PrimaryKeyRelatedField(
        source='classroom', queryset=Classroom.objects.all(), write_only=True
    ) #Receive an id which get translated to real Classroom object

    class Meta:
        model = ClassroomEnrollment
        fields = ['id', 'classroom_id', 'student_id', 'enrolled_at']
    
    def create(self, validated_data):
        student = self.context.get('student')
        if student is None:
            raise serializers.ValidationError("Serializer context must include 'student'.")
        classroom_id = validated_data.pop('classroom_id') #Receiving only a classroom id
        classroom = Classroom.objects.get(classroom_id = classroom_id)

        #see if object already exists and if the classroom is active 
        if ClassroomEnrollment.objects.filter(student=student, classroom=classroom).exists():
            raise serializers.ValidationError(
                "This student is already enrolled in this course."
            )
        if not classroom.is_active:
            raise serializers.ValidationError(
                "This course is current inactive."
            )
        if classroom.capacity >= 10:
            raise serializers.ValidationError(
                "This classroom is currently full."
            )
            
        
        #see if the student has enrolled into the lessons by 
        # - Take classroom's lesson, take id 
        # - Find if student present in lesson_enrollment using lesson_id 
        # checking lessons_id and student_id pair in lesson enrollment
        classroom_lesson = classroom.lesson 
        if not LessonEnrollment.objects.filter(lesson=classroom_lesson, student=student).exists(): 
            raise serializers.ValidationError(
                "This student is not enrolled in related lessons."
            )

        classroomEnrollment = ClassroomEnrollment.objects.create(
            student = student,
            classroom = classroom,
            **validated_data #unpack the rest of the validated data
        )
        return classroomEnrollment 

"""
Shared serializers
"""

# class CourseSerializer(serializers.ModelSerializer):
#     """
#     Json parsing for courses showing and creation in POST and GET
#     TODO: Needs revamp
#     """
#     enrolled_count = serializers.IntegerField(read_only=True)
#     #This is used during POST, when clicking on a course posts the id only
#     owner_instructor_id = serializers.PrimaryKeyRelatedField(
#         source='owner_instructor', queryset=InstructorProfile.objects.all(), write_only=True
#     )

#     class Meta:
#         model = Course
#         fields = ["enrolled_count", "code", "title", "status", "owner_instructor", "owner_instructor_id", "credits", "description"]
#         read_only_fields = ["owner_instructor"]  

#     #Creating a course from a form, fields in validated_data.
#     def create(self, validated_data): 
#         """
#         POST function for course creation. Due to no nested fields, no need for external serializers
#         """
#         request = self.context.get("request") #read the current request (who is requesting?)
#         if "owner_instructor" not in validated_data and request and hasattr(request, "user"):
#             #In case validated data isn't storing owner_instructor, but user instead
#             #Grab instructor based on user field and add it into the validated data 
#             try:
#                 owner = InstructorProfile.objects.get(user=request.user)
#                 validated_data["owner_instructor"] = owner
#             except InstructorProfile.DoesNotExist:
#                 pass
#         return Course.objects.create(**validated_data)


class ClassroomSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(read_only=True)
    lesson = serializers.PrimaryKeyRelatedField(read_only=True)
    # API-facing names mapped to model fields
    day = serializers.CharField(source="day_of_week")
    start_time = serializers.TimeField(source="time_start")
    end_time = serializers.TimeField(source="time_end")
    capacity = serializers.IntegerField(min_value=1, max_value=10)
    # you compute duration on the FE if missing; keeping write_only is okay
    duration_minutes = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Classroom
        fields = [
            "classroom_id",
            "lesson",
            "day", "start_time", "end_time",
            "duration_minutes", "capacity",
            "is_active", "instructor", "created_at",
            "enrolled_count",
        ]
        read_only_fields = ["lesson", "instructor", "created_at"]

    def validate(self, attrs):
        # pull values (handles create/update)
        inst = getattr(self.instance, "instructor", None)
        req = self.context.get("request")
        if not inst and req and getattr(req.user, "is_authenticated", False):
            from .models import InstructorProfile
            inst = InstructorProfile.objects.filter(user=req.user).first()

        lesson = (
            self.context.get("lesson")
            or attrs.get("lesson")
            or getattr(self.instance, "lesson", None)
        )
        day = attrs.get("day_of_week") or getattr(self.instance, "day_of_week", None)
        t_start = attrs.get("time_start") or getattr(self.instance, "time_start", None)
        t_end   = attrs.get("time_end")   or getattr(self.instance, "time_end", None)

        if not (lesson and day and t_start and t_end):
            return attrs

        if t_end <= t_start:
            raise serializers.ValidationError({"end_time": "end_time must be after start_time"})

        from .models import Classroom
        base = Classroom.objects.filter(day_of_week=day)
        if self.instance:
            base = base.exclude(pk=self.instance.pk)

        # A) no overlaps within the SAME LESSON (weekly slot)
        overlaps_lesson = base.filter(
            lesson=lesson,
            time_start__lt=t_end,
            time_end__gt=t_start,
        ).exists()

        # B) no overlaps for the SAME INSTRUCTOR (across lessons)
        overlaps_instr = False
        if inst:
            overlaps_instr = base.filter(
                instructor=inst,
                time_start__lt=t_end,
                time_end__gt=t_start,
            ).exists()

        if overlaps_lesson or overlaps_instr:
            raise serializers.ValidationError(
                {"non_field_errors": ["This time overlaps an existing classroom. Pick a different slot."]}
            )
        return attrs
