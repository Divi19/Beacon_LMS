from django.test import TestCase
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from .models import (
    User, InstructorProfile, StudentProfile, Course, Enrollment,
    Lesson, Classroom, LessonPrerequisite, ClassroomEnrollment
)
from .serializers import (
    LoginSerializer, StudentSerializer, EnrollmentSerializer, ClassroomEnrollmentSerializer
)
import datetime


class UserModelTests(TestCase):
    def test_create_user(self):
        user = User.objects.create(email="test@example.com", password_hash="password123", role="student")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.is_authenticated)

    def test_duplicate_email_fails(self):
        User.objects.create(email="dup@example.com", password_hash="pw", role="student")
        with self.assertRaises(IntegrityError):
            User.objects.create(email="dup@example.com", password_hash="pw", role="student")


class ProfileTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(email="student@example.com", password_hash="pw", role="student")

    def test_student_profile_creation(self):
        profile = StudentProfile.objects.create(user=self.user, full_name="John Doe", student_no="S123")
        self.assertEqual(profile.user.email, "student@example.com")
        self.assertEqual(profile.student_no, "S123")


class CourseTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(email="inst@example.com", password_hash="pw", role="instructor")
        self.instructor = InstructorProfile.objects.create(user=self.user, full_name="Inst One", staff_no="T123")

    def test_course_creation(self):
        course = Course.objects.create(title="Math 101", owner_instructor=self.instructor)
        self.assertIsNotNone(course.course_id)
        self.assertEqual(course.status, Course.CourseStatus.ACTIVE)


class EnrollmentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(email="stud@example.com", password_hash="pw", role="student")
        self.student = StudentProfile.objects.create(user=self.user, full_name="Stud One", student_no="S001")
        self.inst = InstructorProfile.objects.create(
            user=User.objects.create(email="inst@example.com", password_hash="pw", role="instructor"),
            full_name="Inst",
            staff_no="T111"
        )
        self.course = Course.objects.create(title="History", owner_instructor=self.inst)

    def test_student_enrollment(self):
        enr = Enrollment.objects.create(student=self.student, course=self.course)
        self.assertEqual(enr.student.student_no, "S001")

    def test_duplicate_enrollment_fails(self):
        Enrollment.objects.create(student=self.student, course=self.course)
        with self.assertRaises(IntegrityError):
            Enrollment.objects.create(student=self.student, course=self.course)


class LessonTests(TestCase):
    def setUp(self):
        inst_user = User.objects.create(email="inst2@example.com", password_hash="pw", role="instructor")
        self.inst = InstructorProfile.objects.create(user=inst_user, full_name="Teach", staff_no="T999")
        self.course = Course.objects.create(title="Biology", owner_instructor=self.inst)

    def test_lesson_creation(self):
        lesson = Lesson.objects.create(course=self.course, created_by=self.inst, title="Cells")
        self.assertIsNotNone(lesson.lesson_id)
        self.assertEqual(lesson.status, Lesson.LessonStatus.ACTIVE)


class LoginSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(email="login@example.com", password_hash="pw123", role="student")

    def test_valid_login(self):
        data = {"email": "login@example.com", "password": "pw123"}
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["user"].email, self.user.email)

    def test_invalid_login(self):
        data = {"email": "login@example.com", "password": "wrong"}
        serializer = LoginSerializer(data=data)
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
