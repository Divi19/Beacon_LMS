from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers

from .models import (
    User, InstructorProfile, StudentProfile,
    Course, CourseDraft, Lesson, LessonPrerequisite,
    Classroom, Enrollment, LessonEnrollment, ClassroomEnrollment
)

# -------------------- AUTH --------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs['email']
        password = attrs['password']
        user = User.objects.filter(email__iexact=email).first()
        generic_error = serializers.ValidationError("Invalid email or password.")

        if user is None or not check_password(password, user.password_hash):
            raise generic_error

        attrs['user'] = user
        return attrs


class CurrentUserSerializer(serializers.ModelSerializer):
    instructor_profile_id = serializers.SerializerMethodField()
    instructor_full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["user_id", "email", "role", "instructor_profile_id", "instructor_full_name"]

    def get_instructor_profile_id(self, obj):
        prof = InstructorProfile.objects.filter(user=obj).only("instructor_profile_id").first()
        return prof.instructor_profile_id if prof else None

    def get_instructor_full_name(self, obj):
        prof = InstructorProfile.objects.filter(user=obj).only("full_name").first()
        return prof.full_name if prof else None


# -------------------- CORE SERIALIZERS --------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'email', 'password_hash', 'role', 'created_at']
        extra_kwargs = {
            'password_hash': {'write_only': True},   # never expose the hash
            'created_at': {'read_only': True},
        }


class InstructorSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = InstructorProfile
        fields = ["instructor_profile_id", "user", "full_name", "staff_no"]


class CourseSerializer(serializers.ModelSerializer):
    # Allow POST with owner_instructor_id while keeping the FK read-only
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source='owner_instructor',
        queryset=InstructorProfile.objects.all(),
        write_only=True
    )

    class Meta:
        model = Course
        fields = [
            "course_id", "code", "title", "status",
            "owner_instructor", "owner_instructor_id",
            "credits", "director", "description"
        ]
        read_only_fields = ["owner_instructor", "course_id"]

    def create(self, validated_data):
        # owner_instructor is already set by owner_instructor_id via 'source'
        return Course.objects.create(**validated_data)


class StudentSerializer(serializers.ModelSerializer):
    # Flat email/password inputs; a User will be created
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = StudentProfile
        fields = ['student_profile_id', 'full_name', 'student_no', 'locked_at', 'email', 'password']
        read_only_fields = ['student_profile_id', 'student_no']

    def create(self, validated_data):
        email = validated_data.pop('email')
        raw_pwd = validated_data.pop('password')

        user = User.objects.create(
            email=email,
            password_hash=make_password(raw_pwd),
            role='student',
        )
        student = StudentProfile.objects.create(user=user, **validated_data)
        return student


class EnrollmentSerializer(serializers.ModelSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        source='course', queryset=Course.objects.all(), write_only=True
    )

    class Meta:
        model = Enrollment
        fields = ['enrollment_id', 'course_id', 'enrolled_at']
        read_only_fields = ['enrollment_id', 'enrolled_at']

    def create(self, validated_data):
        student = self.context.get('student')
        if student is None:
            raise serializers.ValidationError("Serializer context must include 'student'.")

        course = validated_data.pop('course')

        # Enforce UNIQUE(student, course)
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError("This student is already enrolled in this course.")

        # treat active status case-insensitively
        if (course.status or '').lower() != 'active':
            raise serializers.ValidationError("This course is currently inactive.")

        return Enrollment.objects.create(student=student, course=course, **validated_data)


#  add serializers for Lesson/Classroom if you expose them via API later
class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            'lesson_id', 'course', 'title', 'description', 'objectives',
            'duration_weeks', 'status', 'is_active', 'created_by', 'created_at'
        ]
        read_only_fields = ['lesson_id', 'created_at']


class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = [
            'id', 'lesson', 'instructor', 'title', 'duration_weeks', 'is_active',
            'capacity', 'day_of_week', 'time_start', 'time_end', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
