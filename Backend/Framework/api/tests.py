from django.test import TestCase
from django.db import IntegrityError
from django.db import models
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient
from .models import *
from .serializers import *
import datetime

"""
Testing models 
"""

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
        profile = StudentProfile.objects.create(user=self.user, first_name="John", last_name = "Doe", title="Mr.")
        self.assertEqual(profile.user.email, "student@example.com")


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
        self.student = StudentProfile.objects.create(user=self.user, first_name="Stud", last_name="One")
        self.inst = InstructorProfile.objects.create(
            user=User.objects.create(email="inst@example.com", password_hash="pw", role="instructor"),
            full_name="Inst",
            staff_no="T111"
        )
        self.course = Course.objects.create(title="History", owner_instructor=self.inst)

    def test_student_enrollment(self):
        enr = Enrollment.objects.create(student=self.student, course=self.course)
        self.assertEqual(enr.student.first_name, "Stud")
        self.assertEqual(enr.student.last_name, "One")

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


"""
Testing matching fields
"""

def assert_model_fields(model_class, expected: dict):
    """
    expected = {
      "field_name": {
        "type": models.CharField | models.IntegerField | models.BooleanField | models.DateTimeField | models.JSONField | models.ForeignKey | ...,
        # optional:
        "primary_key": False,
        "unique": False,
        "null": False,
        "blank": False,
        "db_index": False,
        "max_length": 255,       # for CharField
        "default": models.fields.NOT_PROVIDED,
        # for relations:
        "related_model": None,   # actual model class
        "on_delete": models.CASCADE,
        "related_name": None,
      }
    }
    """
    opts = model_class._meta

    # presence
    for fname in expected:
        try:
            opts.get_field(fname)
        except Exception as e:
            raise AssertionError(f"{model_class.__name__} missing field: {fname}") from e

    # attributes
    for fname, spec in expected.items():
        f = opts.get_field(fname)
        exp_type = spec["type"]
        if not isinstance(f, exp_type):
            raise AssertionError(f"{model_class.__name__}.{fname} is {type(f)} expected {exp_type}")

        for attr in ["primary_key", "unique", "null", "blank", "db_index"]:
            if attr in spec and getattr(f, attr) != spec[attr]:
                raise AssertionError(
                    f"{model_class.__name__}.{fname}.{attr}={getattr(f, attr)} expected {spec[attr]}"
                )

        if isinstance(f, models.CharField) and "max_length" in spec and f.max_length != spec["max_length"]:
            raise AssertionError(
                f"{model_class.__name__}.{fname}.max_length={f.max_length} expected {spec['max_length']}"
            )

        if "default" in spec and f.default != spec["default"]:
            raise AssertionError(
                f"{model_class.__name__}.{fname}.default={f.default} expected {spec['default']}"
            )

        if isinstance(f, (models.ForeignKey, models.OneToOneField, models.ManyToManyField)):
            if "related_model" in spec and spec["related_model"] is not None:
                if f.remote_field.model != spec["related_model"]:
                    raise AssertionError(
                        f"{model_class.__name__}.{fname}.related_model={f.remote_field.model} "
                        f"expected {spec['related_model']}"
                    )
            if isinstance(f, (models.ForeignKey, models.OneToOneField)) and "on_delete" in spec:
                if f.remote_field.on_delete != spec["on_delete"]:
                    raise AssertionError(
                        f"{model_class.__name__}.{fname}.on_delete={f.remote_field.on_delete} "
                        f"expected {spec['on_delete']}"
                    )
            if "related_name" in spec and spec["related_name"] is not None:
                if f.remote_field.related_name != spec["related_name"]:
                    raise AssertionError(
                        f"{model_class.__name__}.{fname}.related_name={f.remote_field.related_name} "
                        f"expected {spec['related_name']}"
                    )
            

# -------------------------
# USER
# -------------------------
def test_user_fields():
    expected = {
        "user_id": {"type": models.AutoField, "primary_key": True},
        "email": {"type": models.EmailField, "unique": True, "null": False, "blank": False},
        "password_hash": {"type": models.CharField, "max_length": 255, "null": False, "blank": False},
        "role": {"type": models.CharField, "max_length": 50, "null": False, "blank": False},
        "created_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(User, expected)

# -------------------------
# STUDENT_PROFILE
# -------------------------
def test_student_profile_fields():
    expected = {
        "student_profile_id": {"type": models.AutoField, "primary_key": True},
        "user": {"type": models.ForeignKey, "related_model": User, "on_delete": models.CASCADE, "null": False},
        "last_name": {"type": models.CharField, "max_length": 100, "null": False, "blank": False},
        "first_name": {"type": models.CharField, "max_length": 100, "null": False, "blank": False},
        "titled": {"type": models.CharField, "max_length": 30, "null": True, "blank": True},  # optional
        "locked_at": {"type": models.DateTimeField, "null": True},
    }
    assert_model_fields(StudentProfile, expected)

# -------------------------
# INSTRUCTOR_PROFILE
# -------------------------
def test_instructor_profile_fields():
    expected = {
        "instructor_profile_id": {"type": models.AutoField, "primary_key": True},
        "user": {"type": models.ForeignKey, "related_model": User, "on_delete": models.CASCADE, "null": False},
        "full_name": {"type": models.CharField, "max_length": 200, "null": False, "blank": False},
        "staff_no": {"type": models.CharField, "max_length": 50, "unique": True, "null": False, "blank": False},
    }
    assert_model_fields(InstructorProfile, expected)

# -------------------------
# COURSE
# -------------------------
def test_course_fields():
    expected = {
        "course_id": {"type": models.CharField, "primary_key": True, "max_length": 50},
        "title": {"type": models.CharField, "max_length": 255, "null": False, "blank": False},
        "status": {"type": models.CharField, "max_length": 30, "null": False, "blank": False},
        "owner_instructor": {"type": models.ForeignKey, "related_model": InstructorProfile, "on_delete": models.PROTECT, "null": False},
    }
    assert_model_fields(Course, expected)

# -------------------------
# CLASSROOM
# -------------------------
def test_classroom_fields():
    # Your ERD shows "created_" – assuming that's a typo for "created_at".
    expected = {
        "classroom_id": {"type": models.CharField, "primary_key": True, "max_length": 50},
        "director": {"type": models.CharField, "max_length": 200, "null": False, "blank": False},
        "location": {"type": models.CharField, "max_length": 200, "null": False, "blank": False},
        "duration_weeks": {"type": models.IntegerField, "null": False},
        "capacity": {"type": models.IntegerField, "null": False},
        "is_online": {"type": models.BooleanField, "null": False},
        "zoom_link": {"type": models.CharField, "max_length": 255, "null": True, "blank": True},
        "is_active": {"type": models.BooleanField, "null": False},
        "created_at": {"type": models.DateTimeField, "null": False},  # if you actually named 'created_', update here
    }
    assert_model_fields(Classroom, expected)

# -------------------------
# LESSON
# -------------------------
def test_lesson_fields():
    expected = {
        "lesson_id": {"type": models.CharField, "primary_key": True, "max_length": 50},
        "course": {"type": models.ForeignKey, "related_model": Course, "on_delete": models.CASCADE, "null": False},
        "title": {"type": models.CharField, "max_length": 255, "null": False, "blank": False},
        "description": {"type": models.TextField, "null": True, "blank": True},
        "objectives": {"type": models.TextField, "null": True, "blank": True},
        "duration_weeks": {"type": models.IntegerField, "null": False},
        "credits": {"type": models.IntegerField, "null": False},
        "status": {"type": models.CharField, "max_length": 30, "null": False, "blank": False},
        "designer": {"type": models.ForeignKey, "related_model": InstructorProfile, "on_delete": models.SET_NULL, "null": True},
        "created_by": {"type": models.ForeignKey, "related_model": InstructorProfile, "on_delete": models.PROTECT, "null": False},
        "created_at": {"type": models.DateTimeField, "null": False},
        "updated_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(Lesson, expected)

# -------------------------
# ENROLLMENT
# -------------------------
def test_enrollment_fields():
    expected = {
        "enrollment_id": {"type": models.AutoField, "primary_key": True},
        "student": {"type": models.ForeignKey, "related_model": StudentProfile, "on_delete": models.CASCADE, "null": False},
        "course": {"type": models.ForeignKey, "related_model": Course, "on_delete": models.CASCADE, "null": False},
        "enrolled_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(Enrollment, expected)

# -------------------------
# CLASSROOM_ENROLLMENT
# -------------------------
def test_classroom_enrollment_fields():
    expected = {
        "classroom": {"type": models.ForeignKey, "related_model": Classroom, "on_delete": models.CASCADE, "null": False},
        "student": {"type": models.ForeignKey, "related_model": StudentProfile, "on_delete": models.CASCADE, "null": False},
        "enrolled_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(ClassroomEnrollment, expected)

# -------------------------
# LESSON_ENROLLMENT
# -------------------------
def test_lesson_enrollment_fields():
    expected = {
        "lesson": {"type": models.ForeignKey, "related_model": Lesson, "on_delete": models.CASCADE, "null": False},
        "student": {"type": models.ForeignKey, "related_model": StudentProfile, "on_delete": models.CASCADE, "null": False},
        "enrolled_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(LessonEnrollment, expected)

# -------------------------
# LESSON_PREREQUISITE
# -------------------------
def test_lesson_prerequisite_fields():
    expected = {
        "lesson": {"type": models.ForeignKey, "related_model": Lesson, "on_delete": models.CASCADE, "null": False},
        "prereq_lesson": {"type": models.ForeignKey, "related_model": Lesson, "on_delete": models.CASCADE, "null": False},
    }
    assert_model_fields(LessonPrerequisite, expected)

# -------------------------
# LESSON_READING
# -------------------------
def test_lesson_reading_fields():
    expected = {
        "reading_id": {"type": models.AutoField, "primary_key": True},
        "lesson": {"type": models.ForeignKey, "related_model": Lesson, "on_delete": models.CASCADE, "null": False},
        "title": {"type": models.CharField, "max_length": 255, "null": False, "blank": False},
        "url": {"type": models.URLField, "null": False, "blank": False},
        "created_at": {"type": models.DateTimeField, "null": False},
        "updated_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(LessonReading, expected)

# -------------------------
# STUDENT_READING
# -------------------------
def test_student_reading_fields():
    expected = {
        "reading": {"type": models.ForeignKey, "related_model": LessonReading, "on_delete": models.CASCADE, "null": False},
        "student": {"type": models.ForeignKey, "related_model": StudentProfile, "on_delete": models.CASCADE, "null": False},
        "is_completed": {"type": models.BooleanField, "null": False},
    }
    assert_model_fields(StudentReading, expected)

# -------------------------
# LESSON_CLASSROOM
# -------------------------
def test_lesson_classroom_fields():
    expected = {
        "lesson": {"type": models.ForeignKey, "related_model": Lesson, "on_delete": models.CASCADE, "null": False},
        "classroom": {"type": models.ForeignKey, "related_model": Classroom, "on_delete": models.CASCADE, "null": False},
        "session_times_json": {"type": models.JSONField, "null": True, "blank": True},
        "linked_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(LessonClassroom, expected)

# -------------------------
# LESSON_ASSIGNMENT
# -------------------------
def test_lesson_assignment_fields():
    expected = {
        "assignment_id": {"type": models.AutoField, "primary_key": True},
        "lesson": {"type": models.ForeignKey, "related_model": Lesson, "on_delete": models.CASCADE, "null": False},
        "title": {"type": models.CharField, "max_length": 255, "null": False, "blank": False},
        "description": {"type": models.TextField, "null": True, "blank": True},
        "points": {"type": models.IntegerField, "null": False},
        "created_at": {"type": models.DateTimeField, "null": False},
        "updated_at": {"type": models.DateTimeField, "null": False},
    }
    assert_model_fields(LessonAssignment, expected)

# -------------------------
# STUDENT_ASSIGNMENT
# -------------------------
def test_student_assignment_fields():
    expected = {
        "assignment": {"type": models.ForeignKey, "related_model": LessonAssignment, "on_delete": models.CASCADE, "null": False},
        "student": {"type": models.ForeignKey, "related_model": StudentProfile, "on_delete": models.CASCADE, "null": False},
        "is_completed": {"type": models.BooleanField, "null": False},
    }
    assert_model_fields(StudentAssignment, expected)



"""
Testing Student Registration 
"""

def api():
    return APIClient()

def url():
    return "/api/student/register/"

def valid_payload(**overrides):
    base = {
        "email": "student1@example.com",
        "password": "PlainPw123!",   
        "first_name": "Rin",
        "last_name": "Lee",
        "title": "Mr",
    }
    base.update(overrides)
    return base

def test_register_success_creates_user_and_student(api, url, db):
    res = api.post(url, valid_payload(), format="json")
    assert res.status_code == status.HTTP_201_CREATED

    # Response should be from StudentSerializer(student).data
    # It should NOT include write_only fields (email, password)
    assert "email" not in res.data
    assert "password" not in res.data

    # StudentProfile created
    student = StudentProfile.objects.first()
    assert student.first_name == "Rin"
    assert student.last_name == "Lee"
    assert student.title == "Mr"

    # Linked User created with same email and plain password stored in password_hash (per your current code)
    user = User.objects.first()
    assert user.email == "student1@example.com"
    assert user.password_hash == "PlainPw123!"  
    assert user.role == "student"  

def test_missing_required_fields(api, url, db):
    # Missing email
    res = api.post(url, valid_payload(email=None), format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in res.data

    # Missing password
    res = api.post(url, valid_payload(password=None), format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in res.data

    # Missing first_name
    p = valid_payload()
    p.pop("first_name")
    res = api.post(url, p, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "first_name" in res.data

    # Missing last_name
    p = valid_payload()
    p.pop("last_name")
    res = api.post(url, p, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "last_name" in res.data

    # Missing title
    p = valid_payload()
    p.pop("title")
    res = api.post(url, p, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "title" in res.data

def test_email_must_be_valid(api, url, db):
    res = api.post(url, valid_payload(email="not-an-email"), format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in res.data  # DRF EmailField should complain

def test_locked_at_optional_and_passthrough(api, url, db):
    res = api.post(url, valid_payload(locked_at=None), format="json")
    assert res.status_code == status.HTTP_201_CREATED
    student = StudentProfile.objects.get()
    assert student.locked_at is None

def test_response_schema_doesnt_leak_sensitive(api, url, db):
    res = api.post(url, valid_payload(), format="json")
    assert res.status_code == status.HTTP_201_CREATED
    # Only fields defined in StudentSerializer.Meta.fields should appear:
    # ['first_name', 'last_name', 'title', 'locked_at', 'password', 'email']
    # BUT password/email are write_only, so they must not be present.
    for f in ["password", "email"]:
        assert f not in res.data

    for f in ["first_name", "last_name", "title", "locked_at"]:
        assert f in res.data
