#rest
from rest_framework import serializers
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.validators import UniqueTogetherValidator

#djando
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import authenticate
from django.db.models.functions import Lower, Coalesce
from django.db.models import Sum

#local 
from .models import *

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
    first_name = serializers.CharField(write_only = True) 
    last_name = serializers.CharField(write_only = True) 
    title = serializers.CharField(write_only = True)  
    #user = UserSerializer() 

    class Meta:
        model = StudentProfile
        fields = ['first_name', 'last_name', 'title', 'locked_at', 'password', 'email']
        read_only_fields = ['student_profile_id']

    #during post 
    def create(self, validated_data):
        """
        POST student creation (registration), invoked implicitly using .save() in views
        """
        email = validated_data.pop('email', None) 
        password = validated_data.pop('password') #TODO: Is it password or password hash? 
        role = validated_data.pop('role', 'student')
        
        user = User.objects.create(
            email = email,
            password_hash=password, #plain password 
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

class LessonEnrollmentSerializer(serializers.ModelSerializer):
    # accept classroom id in the request body
    lesson_id = serializers.PrimaryKeyRelatedField(
        source="lesson", queryset=Lesson.objects.all(), write_only=True
    )
    
    class Meta:
        model = LessonEnrollment
        fields = ["id", "lesson_id", "lesson", "student", "enrolled_at"]
        read_only_fields = ["lesson", "student", "enrolled_at"]

    def create(self, validated_data):
        student = self.context.get("student")
        if not student:
            raise serializers.ValidationError("Serializer context must include 'student'.")
        # DRF already converted classroom_id -> Classroom instance
        lesson = validated_data.pop("lesson")

        # business rules
        if not lesson.is_active:
            raise serializers.ValidationError("This lesson is currently inactive.")
        if LessonEnrollment.objects.filter(student=student, lesson=lesson).exists():
            raise serializers.ValidationError("This student is already enrolled in this lesson.")
        if not Enrollment.objects.filter(course=lesson.course, student=student).exists():
            raise serializers.ValidationError("Student must be enrolled in a course first")
        # if not LessonEnrollment.objects.filter(lesson=lesson, student=student).exists():
        #     raise serializers.ValidationError("This student is not enrolled in the related lesson.")
        # if ClassroomEnrollment.objects.filter(classroom=classroom).count() >= classroom.capacity:
        #     raise serializers.ValidationError("This classroom is currently full.")
        # if ClassroomEnrollment.objects.filter(classroom__lesson=lesson).exists():
        #     raise serializers.ValidationError("This student is already in a related classroom.")
        return LessonEnrollment.objects.create(student=student, lesson=lesson, **validated_data)

class ClassroomEnrollmentSerializer(serializers.ModelSerializer):
    # accept classroom id in the request body
    classroom_id = serializers.PrimaryKeyRelatedField(
        source="classroom", queryset=Classroom.objects.all(), write_only=True
    )
    
    class Meta:
        model = ClassroomEnrollment
        fields = ["id", "classroom_id", "classroom", "student_id", "enrolled_at"]
        read_only_fields = ["classroom", "student_id", "enrolled_at"]

    def create(self, validated_data):
        student = self.context.get("student")
        if student is None:
            raise serializers.ValidationError("Serializer context must include 'student'.")
        # DRF already converted classroom_id -> Classroom instance
        classroom = validated_data.pop("classroom")
        lesson = classroom.lesson  # derive lesson from classroom

        # business rules
        if not classroom.is_active:
            raise serializers.ValidationError("This classroom is currently inactive.")
        if ClassroomEnrollment.objects.filter(student=student, classroom=classroom).exists():
            raise serializers.ValidationError("This student is already enrolled in this classroom.")
        if not LessonEnrollment.objects.filter(lesson=lesson, student=student).exists():
            raise serializers.ValidationError("This student is not enrolled in the related lesson.")
        if ClassroomEnrollment.objects.filter(classroom=classroom).count() >= classroom.capacity:
            raise serializers.ValidationError("This classroom is currently full.")
        if ClassroomEnrollment.objects.filter(classroom__lesson=lesson).exists():
            raise serializers.ValidationError("This student is already in a related classroom.")
        return ClassroomEnrollment.objects.create(student=student, classroom=classroom, **validated_data)

"""
Shared serializers
"""
class LessonOutSerializer(serializers.ModelSerializer):
    """
    Seen only in responses
    """
    class Meta:
        model = Lesson
        fields = [
            "lesson_id", "course", "title", "description", "credits",
            "objectives", "duration_weeks", "status", "created_by", "created_at"
        ]
        read_only_fields = fields

class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonOutSerializer(many=True, read_only=True, source="lesson_set")
    enrolled_count = serializers.IntegerField(read_only=True)

    # Client sends a PK here (optional). DRF resolves it to an InstructorProfile instance
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source="owner_instructor",
        queryset=InstructorProfile.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    # What you return in responses (string or nested serializer)
    owner_instructor = serializers.CharField(
        source="owner_instructor.full_name",
        read_only=True,
    )

    course_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Course
        fields = [
            "enrolled_count",
            "course_id",
            "title",
            "status",
            "owner_instructor_id",  # write-only input
            "owner_instructor",     # read-only output
            "description",
            "credits",
            "lessons"
        ]
        read_only_fields = ["owner_instructor", "credits"]

    def create(self, validated_data):
        # If client didn’t provide owner_instructor_id, default to request.user’s profile
        if "owner_instructor" not in validated_data:
            req = self.context.get("request")
            if req and getattr(req.user, "is_authenticated", False):
                owner = InstructorProfile.objects.filter(user=req.user).first()
                if owner:
                    validated_data["owner_instructor"] = owner

        # Optional: auto-generate course_id if blank/omitted
        cid = (validated_data.get("course_id") or "").strip()
        if not cid:
            # validated_data["course_id"] = generate_custom_id()
            pass

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Lock course_id after creation
        validated_data.pop("course_id", None)
        return super().update(instance, validated_data)

class ClassroomSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(read_only=True)
    lesson = serializers.PrimaryKeyRelatedField(read_only=True)
    #Request
    day = serializers.CharField(source="day_of_week", write_only=True)
    start_time = serializers.TimeField(source="time_start", write_only=True,)
    end_time = serializers.TimeField(source="time_end", write_only=True,)
    capacity = serializers.IntegerField(min_value=1, max_value=10)
    duration_minutes = serializers.IntegerField(required=False)
    classroom_id = serializers.CharField(required=False, allow_blank=True)
    
    
    #Responses 
    day_of_week = serializers.CharField(read_only=True)
    time_start  = serializers.TimeField(read_only=True)
    time_end    = serializers.TimeField(read_only=True)
    class Meta:
        model = Classroom
        fields = [
            "classroom_id",
            "lesson", 
            "day", "start_time", "end_time",
            "day_of_week", "time_start", "time_end",
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

class LessonSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), write_only=True
    )
    enrolled_count = serializers.IntegerField(read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=InstructorProfile.objects.all(), write_only=True
    ) #Sets the instructor
    title =  serializers.CharField(required=True, allow_blank=True)
    credits = serializers.IntegerField(required=True)
    duration_weeks = serializers.CharField(required=True, allow_blank=True)
    description = serializers.CharField(required=True, allow_blank=True)
    objectives = serializers.CharField(required=True, allow_blank=True)
   
    class Meta:
        model = Lesson
        fields = ["objectives", "lesson_id", "enrolled_count", "credits", "course", "title", "description", "objectives", "duration_weeks", "status", "created_by"]
        read_only_fields = ["lesson_id", "owner_instructor", "created_by"] 

    def create(self, validated_data): 
        """
        POST function for lesson creation. Due to no nested fields, no need for external serializers
        """
        request = self.context.get("request") #read the current request (who is requesting?)
        if "owner_instructor" not in validated_data and request and hasattr(request, "user"):
            #In case validated data isn't storing owner_instructor, but user instead
            pass #Instructor is someone else
        else:
            #No instructor inputted 
            try:
                #Grab instructor based on user field and add it into the validated data 
                owner = InstructorProfile.objects.get(user=request.user)
                validated_data["created_by"] = owner
            except InstructorProfile.DoesNotExist:
                pass

        return Course.objects.create(**validated_data) 
    
    def update(self, instance, validated_data):
        validated_data.pop("created_by", None)
        return super().update(instance, validated_data)

        

class LessonPrereqBulkInSerializer(serializers.Serializer):
    prerequisites = serializers.ListField(
        child=serializers.CharField(min_length=1, allow_blank=False),
        allow_empty=False
    )
    mode = serializers.ChoiceField(choices=["merge", "replace"], required=False, default="merge")

    def validate(self, attrs):
        lesson_id = self.context.get("lesson_id")
        if not lesson_id:
            raise serializers.ValidationError({"lesson_id": "Missing lesson_id."})

        try:
            lesson = Lesson.objects.get(lesson_id=lesson_id)
        except Lesson.DoesNotExist:
            raise serializers.ValidationError({"lesson_id": f"Lesson '{lesson_id}' not found."})

        raw_ids = [x.strip() for x in attrs["prerequisites"] if x and x.strip()]
        if not raw_ids:
            raise serializers.ValidationError({"prerequisites": "Provide at least one prerequisite lesson_id."})

        seen, clean_ids = set(), []
        for lid in raw_ids:
            if lid not in seen:
                seen.add(lid); clean_ids.append(lid)

        if lesson.lesson_id in seen:
            raise serializers.ValidationError({"prerequisites": "A lesson cannot be a prerequisite of itself."})

        found = {l.lesson_id: l for l in Lesson.objects.filter(lesson_id__in=clean_ids)}
        missing = [lid for lid in clean_ids if lid not in found]
        if missing:
            raise serializers.ValidationError({"prerequisites": [f"Not found: {', '.join(missing)}"]})

        attrs["lesson"] = lesson
        attrs["prereq_list"] = [found[lid] for lid in clean_ids]
        return attrs

class LessonPrereqOutSerializer(serializers.ModelSerializer):
    # use prereq_lesson, not prerequisite
    prerequisite_id = serializers.CharField(source="prereq_lesson.lesson_id", read_only=True)

    class Meta:
        model = LessonPrerequisite
        fields = ["prerequisite_id"]

class LessonBulkCreateInSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=50)  # cap to prevent abuse
    credits = serializers.IntegerField(min_value=0) 
    base_title = serializers.CharField(required=False, allow_blank=True, default="Lesson")
    starting_number = serializers.IntegerField(min_value=1, required=False, default=1)
    duration_weeks = serializers.ChoiceField(choices=Lesson.DurationWeeks.choices, required=False, default=Lesson.DurationWeeks.FOUR)
    status = serializers.ChoiceField(choices=Lesson.LessonStatus.choices, required=False, default=Lesson.LessonStatus.ACTIVE)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    objectives = serializers.CharField(required=False, allow_blank=True, allow_null=True)

# class LessonOutSerializer(serializers.ModelSerializer):
#     """
#     Seen only in responses
#     """
#     class Meta:
#         model = Lesson
#         fields = [
#             "lesson_id", "course", "title", "description", "credits",
#             "objectives", "duration_weeks", "status", "created_by", "created_at"
#         ]
#         read_only_fields = fields