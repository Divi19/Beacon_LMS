#rest
from rest_framework import serializers
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.validators import UniqueTogetherValidator

#djando
from django.db.models import Sum, Q, F, OuterRef, Exists
from django.core.exceptions import ObjectDoesNotExist

#local 
from .models import *
import re

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
Admin-related serializers
"""
class AdminSerializer(serializers.ModelSerializer):
    user = UserSerializer() 
    class Meta:
        model = AdminProfile
        fields = ["admin_profile_id", "user", "full_name"]

class InstructorCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for admin creating new instructors
    """
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    title = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = InstructorProfile
        fields = ['instructor_profile_id', 'title', 'full_name', 'email', 'password', 'full_name', 'staff_no']
        read_only_fields = ['instructor_profile_id', 'staff_no']
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        full_name = validated_data.pop('full_name')
        title = validated_data.pop('title', '')
        
        # full_name = f"{first_name} {last_name}".strip()
        
        def generate_staff_no():
            digits = ''.join(random.choices(string.digits, k=5))
            return f"I{digits}"
        
        staff_no = generate_staff_no()
        while InstructorProfile.objects.filter(staff_no=staff_no).exists():
            staff_no = generate_staff_no()
        
        user = User.objects.create(
            email=email,
            password_hash=password,
            role='instructor',
            is_active=True
        )
        
        instructor = InstructorProfile.objects.create(
            user=user,
            title=title,
            full_name=full_name,
            staff_no=staff_no,
            **validated_data
        )
        return instructor

class InstructorListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing instructors (admin view)
    """
    email = serializers.EmailField(source='user.email', read_only=True)
    password = serializers.CharField(source='user.password_hash', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    
    class Meta:
        model = InstructorProfile
        fields = ['instructor_profile_id', 'title', 'full_name', 'staff_no', 'email', 'password', 'is_active']

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

        #Check is user exists 
        is_exist = User.objects.filter(email=email) 
        if is_exist: 
            raise serializers.ValidationError("This email already exists. Are you registered?")
        
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
    
"""
Enrollment
"""

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
    lesson = serializers.SlugRelatedField(
        slug_field="lesson_id",
        queryset=Lesson.objects.all()
    ) 
    student = serializers.SlugRelatedField(
        slug_field="student_profile_id",
        queryset=StudentProfile.objects.all()
    )  
    class Meta:
        model = LessonEnrollment
        fields = ["lesson_enrollment_id", "lesson_id", "lesson", "student", "enrolled_at"]
        read_only_fields = ["lesson", "student", "enrolled_at"]

    def validate(self, attrs):
        lesson  = attrs.get("lesson")  or getattr(self.instance, "lesson",  None)
        student = attrs.get("student") or getattr(self.instance, "student", None)
        if not (lesson and student):
            return attrs  
        REQUIRE_COMPLETED = True  # Must complete prereqs first 
        completed_filter = {}
        if REQUIRE_COMPLETED:
            completed_filter = {
                "status": LessonEnrollment.EnrollmentStatus.COMPLETED
            }
        # All prerequisites for this lesson
        prereqs = LessonPrerequisite.objects.filter(lesson=lesson)

        # For each prerequisite row, annotate whether the student has an enrollment meeting the rule
        has_enrollment = LessonEnrollment.objects.filter(
            student=student,
            lesson=OuterRef("prereq_lesson"),
            **completed_filter
        )
        reqs = prereqs.annotate(has=Exists(has_enrollment))

        # Any missing?
        missing = reqs.filter(has=False).values_list(
            "prereq_lesson__lesson_id", "prereq_lesson__title"
        )

        missing_list = list(missing)
        if missing_list:
            # Build a friendly error
            pretty = [f"{lid} — {title}" for (lid, title) in missing_list]
            raise serializers.ValidationError({
                "lesson": (
                    "Prerequisites not satisfied: "
                    + "; ".join(pretty)
                    + (" must be COMPLETED.)" if REQUIRE_COMPLETED else ". (Prereqs must be ENROLLED.)")
                )
            })

        return attrs

    def create(self, validated_data):
        return super().create(validated_data)
    
class ClassroomEnrollmentSerializer(serializers.ModelSerializer):
    """
    TODO: Needs changing 
    """
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

class LessonSerializer(serializers.ModelSerializer):
    # write-only foreign keys
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), write_only=True)
    created_by = serializers.PrimaryKeyRelatedField(queryset=InstructorProfile.objects.all(), write_only=True, required=False)

    # display-only: pulls full name or email from related 'designer'
    designer_email = serializers.CharField(source="designer.user.email", read_only=True)
    designer_card = serializers.CharField(source="designer.full_name", read_only=True)
    # incoming optional email to resolve designer; accepts "", null, or omit
    designer_input = serializers.EmailField(write_only=True, required=False, allow_blank=True, allow_null=True)

    # other fields
    enrolled_count = serializers.IntegerField(read_only=True)
    title = serializers.CharField(required=True, allow_blank=True)
    credits = serializers.IntegerField(required=True)
    duration_weeks = serializers.CharField(required=True, allow_blank=True)
    description = serializers.CharField(required=True, allow_blank=True)
    objectives = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=True)

    estimated_effort = serializers.IntegerField(required=False)

    class Meta:
        model = Lesson
        fields = [
            "lesson_id",
            "course",
            "title",
            "credits",
            "duration_weeks",
            "description",
            "objectives",
            "status",
            "enrolled_count",
            "designer_email",
            "designer_input",
            "created_by",
            "designer_card",
            "estimated_effort"
        ]
        read_only_fields = ["lesson_id"]

    def validate(self, attrs):
        """
        If a non-empty 'designer_input' email is provided, resolve it to an InstructorProfile
        and set 'designer' (the FK on the Lesson model). If empty/missing, leave as-is.
        """
        # pop so it doesn't try to bind to a non-field later
        designer_email = attrs.pop("designer_input", None)

        # treat empty string / whitespace as "not provided"
        if designer_email and str(designer_email).strip():
            try:
                user = User.objects.get(email=designer_email)
                instructor = InstructorProfile.objects.get(user=user)
                attrs["designer"] = instructor   # assumes Lesson.designer FK exists
            except ObjectDoesNotExist:
                raise serializers.ValidationError({
                    "designer_input": f"No InstructorProfile found for email '{designer_email}'."
                })
     
        return attrs

    def create(self, validated_data):
        """
        Optional: if 'created_by' not provided, default to the logged-in user's InstructorProfile (if any).
        """
        if "designer_input" not in validated_data:
            request = self.context.get("request")
            if request and getattr(request.user, "is_authenticated", False):
                instr = InstructorProfile.objects.filter(user=request.user).first()
                if instr:
                    validated_data["designer"] = instr
        else: 
            designer_email = validated_data.pop("designer_input")
            user = User.objects.get(email=designer_email)
            instructor = InstructorProfile.objects.get(user=user)
            validated_data["designer"] = instructor
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Prevent changing 'created_by' on update.
        """
        validated_data.pop("created_by", None)
        return super().update(instance, validated_data)
    

class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True, source="lesson_set")
    enrolled_count = serializers.IntegerField(read_only=True)

    # Option 1: allow PK
    owner_instructor_id = serializers.PrimaryKeyRelatedField(
        source="owner_instructor",
        queryset=InstructorProfile.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    # Option 2: allow email
    owner_instructor_email = serializers.EmailField(
        write_only=True, required=False, allow_null=True
    )

    # What you return in responses
    owner_instructor = serializers.CharField(
        source="owner_instructor.full_name", read_only=True
    )

    course_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Course
        fields = [
            "enrolled_count",
            "course_id",
            "title",
            "status",
            "owner_instructor_id",     # accepts PK
            "owner_instructor_email",  # accepts email
            "owner_instructor",        # returns full name
            "description",
            "credits",
            "lessons",
        ]
        read_only_fields = ["credits"]

    def _resolve_owner_from_email(self, email: str):
        try:
            user = User.objects.get(email=email)
            return InstructorProfile.objects.get(user=user)
        except (User.DoesNotExist, InstructorProfile.DoesNotExist):
            raise serializers.ValidationError(
                {"owner_instructor_email": "Instructor with this email does not exist."}
            )

    def validate(self, attrs):
        # Prefer email over PK if both provided (or raise if you want to forbid both)
        email = attrs.pop("owner_instructor_email", None)

        if email:
            attrs["owner_instructor"] = self._resolve_owner_from_email(email)
        # else: if owner_instructor_id was provided, DRF already put the instance in attrs["owner_instructor"]
        # else: neither provided → will default in create()

        return attrs

    def create(self, validated_data):
        # Default to current logged-in instructor if none provided
        if "owner_instructor" not in validated_data or validated_data["owner_instructor"] is None:
            req = self.context.get("request")
            if req and getattr(req.user, "is_authenticated", False):
                owner = InstructorProfile.objects.filter(user=req.user).first()
                if owner:
                    validated_data["owner_instructor"] = owner

        # Autogenerate course_id if blank
        cid = (validated_data.get("course_id") or "").strip()
        if not cid:
            validated_data["course_id"] = generate_custom_id()

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Support updating owner via email or PK as in validate()
        return super().update(instance, validated_data)

class ClassroomSerializer(serializers.ModelSerializer):
    #Request
    capacity = serializers.IntegerField(min_value=1, max_value=100)
    zoom_link = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_online = serializers.BooleanField(required=False)
    location = serializers.CharField(required=True, allow_blank=True)

    class Meta:
        model = Classroom
        fields = [
            "capacity", "zoom_link", "is_online", "location"
        ]

    def create(self, validated_data):
        return Classroom.objects.create(**validated_data)
    
    def validate(self, attrs):
        # defaults
        is_online = attrs.get("is_online", False)

        if is_online:
            # online: require zoom_link, capacity forced to 100; location optional/ignored
            if not attrs.get("zoom_link"):
                raise serializers.ValidationError({"zoom_link": "Required for online classrooms."})
            attrs["capacity"] = 100
            # normalize location for online (optional)
            if "location" not in attrs:
                attrs["location"] = ""
        else:
            # physical: require location; zoom_link should be null/blank
            loc = attrs.get("location")
            if not (isinstance(loc, str) and loc.strip()):
                raise serializers.ValidationError({"location": "Required for physical classrooms."})
            # clear zoom for physical to keep data clean
            attrs["zoom_link"] = None

        return attrs


"""
Classroom Linking 
"""
class LessonClassroomSerializer(serializers.ModelSerializer):
    """
    Important for linking 
    """
    time_start = serializers.TimeField(input_formats=["%H:%M"], format="%H:%M")
    time_end   = serializers.TimeField(input_formats=["%H:%M"], format="%H:%M")

    lesson = serializers.SlugRelatedField(
        slug_field="lesson_id",
        queryset=Lesson.objects.all(),
        write_only=True,
        required=True,
    )
    classroom = serializers.SlugRelatedField(
        slug_field="classroom_id",
        queryset=Classroom.objects.all(),
        write_only=True,
        required=True,
    )

    duration_minutes = serializers.IntegerField(read_only=True)
    duration_weeks   = serializers.IntegerField(required=False, allow_null=True)

    # write-only email, used to select a supervisor other than the current user
    supervisor_input = serializers.EmailField(write_only=True, required=False, allow_blank=True, allow_null=True)

    enrolled_count = serializers.IntegerField(read_only=True)
    day_of_week = serializers.CharField()  # consider a ChoiceField if you have fixed days

    # read-only display
    supervisor = serializers.CharField(source="supervisor.full_name", read_only=True)
    
    class Meta:
        model = LessonClassroom
        fields = [
            "supervisor_input", "enrolled_count", "day_of_week",
            "duration_weeks", "time_start", "time_end",
            "duration_minutes", "classroom", "lesson", "supervisor"
        ]
        
    def _resolve_supervisor_for_validation(self, attrs):
        """
        Resolve which InstructorProfile we should validate against:
        - supervisor_input (email) if provided
        - else existing instance.supervisor (on update)
        - else current logged-in instructor
        """
        # 1) explicit email from payload
        email = attrs.get("supervisor_input")
        if email:
            return InstructorProfile.objects.filter(user__email=email).first()

        # 2) existing instance (PATCH/PUT)
        instance = getattr(self, "instance", None)
        if instance and getattr(instance, "supervisor_id", None):
            return instance.supervisor

        # 3) current user
        req = self.context.get("request")
        if req and getattr(req.user, "is_authenticated", False):
            return InstructorProfile.objects.filter(user=req.user).first()

        return None

    def validate(self, attrs):
        """
        Prevent overlaps (end-exclusive) on the same weekday for:
          - SAME classroom
          - SAME supervisor (instructor)
        """
        instance  = getattr(self, "instance", None)

        # Effective values (handle create/update)
        classroom = attrs.get("classroom")   or (instance.classroom if instance else None)
        day       = attrs.get("day_of_week") or (instance.day_of_week if instance else None)
        t_start   = attrs.get("time_start")  or (instance.time_start if instance else None)
        t_end     = attrs.get("time_end")    or (instance.time_end if instance else None)
        lesson    = attrs.get("lesson")      or (instance.lesson if instance else None)

        supervisor = self._resolve_supervisor_for_validation(attrs)

        # Require essentials on create; on partial update, skip until all present
        required = [("classroom", classroom), ("day_of_week", day), ("time_start", t_start),
                    ("time_end", t_end), ("supervisor", supervisor)]
        if any(v is None for _, v in required):
            return attrs

        if t_end <= t_start:
            raise serializers.ValidationError({"time_end": "time_end must be after time_start."})

        # Overlap predicate (end-exclusive)
        overlap_q = Q(time_start__lt=t_end) & Q(time_end__gt=t_start)

        base = LessonClassroom.active.filter(day_of_week=day)
        if instance:
            base = base.exclude(pk=instance.pk)

        # Conflicts
        clash_room = base.filter(classroom=classroom).filter(overlap_q).values("time_start", "time_end").first()
        clash_instructor = base.filter(supervisor=supervisor).filter(overlap_q).values("time_start", "time_end").first()

        if clash_room or clash_instructor:
            msgs = []
            if clash_room:
                msgs.append(
                    f"classroom conflict {clash_room['time_start'].strftime('%H:%M')}–{clash_room['time_end'].strftime('%H:%M')}"
                )
            if clash_instructor:
                msgs.append(
                    f"instructor conflict {clash_instructor['time_start'].strftime('%H:%M')}–{clash_instructor['time_end'].strftime('%H:%M')}"
                )
            raise serializers.ValidationError({"non_field_errors": [f"Overlapping slot: {', '.join(msgs)}. Pick a different time."]})

        return attrs

    def _compute_duration(self, start, end):
        delta = datetime.combine(date.min, end) - datetime.combine(date.min, start)
        return int(delta.total_seconds() // 60)
    
    def create(self, validated_data):
        # duration
        t_start = validated_data["time_start"]
        t_end   = validated_data["time_end"]
        validated_data["duration_minutes"] = self._compute_duration(t_start, t_end)

        # map supervisor_input -> supervisor (InstructorProfile)
        owner_email = validated_data.pop("supervisor_input", None)
        if owner_email:
            try:
                instructor = InstructorProfile.objects.get(user__email=owner_email)
            except InstructorProfile.DoesNotExist:
                raise serializers.ValidationError({"supervisor_input": "Instructor with this email does not exist."})
            validated_data["supervisor"] = instructor
        else:
            # default to current logged-in instructor
            req = self.context.get("request")
            if req and getattr(req.user, "is_authenticated", False):
                owner = InstructorProfile.objects.filter(user=req.user).first()
                if owner:
                    validated_data["supervisor"] = owner

        return LessonClassroom.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        for f in ("day_of_week", "time_start", "time_end", "classroom", "lesson", "duration_weeks"):
            if f in validated_data:
                setattr(instance, f, validated_data[f])

        # allow reassignment via supervisor_input in updates too
        owner_email = validated_data.pop("supervisor_input", None)
        if owner_email:
            try:
                instructor = InstructorProfile.objects.get(user__email=owner_email)
            except InstructorProfile.DoesNotExist:
                raise serializers.ValidationError({"supervisor_input": "Instructor with this email does not exist."})
            instance.supervisor = instructor

        instance.duration_minutes = self._compute_duration(instance.time_start, instance.time_end)
        instance.save()
        return instance

class LessonPrereqOutSerializer(serializers.ModelSerializer):
    """
    Serialize each prerequisite relation, exposing the target lesson's id/title.
    """
    prereq_lesson_id = serializers.CharField(source="prereq_lesson.lesson_id", read_only=True)
    prereq_title = serializers.CharField(source="prereq_lesson.title", read_only=True)

    class Meta:
        model = LessonPrerequisite
        fields = ["prereq_lesson_id", "prereq_title"]


class PrereqInputSerializer(serializers.Serializer):
    """
    Accepts either:
      1) prerequisites as a STRING (newlines/commas allowed), or
      2) prerequisites as a LIST of strings.
    We normalize ourselves to avoid ListField pre-validation.
    """
    prerequisites = serializers.JSONField(required=False, allow_null=True)  # raw; could be list or string
    mode = serializers.ChoiceField(choices=["merge", "replace"], required=False, default="merge")

    _SPLIT = re.compile(r"[,\r\n]+")  # commas or newlines

    def _normalize_to_list(self, raw):
        if raw is None:
            return []

        if isinstance(raw, list):
            items = [str(x).strip() for x in raw if str(x).strip()]
        elif isinstance(raw, str):
            items = [s.strip() for s in self._SPLIT.split(raw) if s.strip()]
        else:
            items = []

        # De-dup while preserving order
        seen, out = set(), []
        for lid in items:
            if lid not in seen:
                seen.add(lid)
                out.append(lid)
        return out

    def validate(self, attrs):
        # lesson_id must be passed via serializer context
        lesson_id = self.context.get("lesson_id")
        if not lesson_id:
            raise serializers.ValidationError({"lesson_id": "Missing lesson_id in context."})

        raw = self.initial_data.get("prerequisites", None)
        normalized = self._normalize_to_list(raw)

        # Determine mode (respect input, default to merge)
        mode = self.initial_data.get("mode", attrs.get("mode", "merge"))

        # Allow "clear all" only in REPLACE mode; still reject empty for MERGE
        if not normalized and mode != "replace":
            raise serializers.ValidationError({"prerequisites": "Provide at least one prerequisite lesson_id."})

        # Anchor lesson
        lesson = Lesson.objects.filter(lesson_id=lesson_id).first()
        if not lesson:
            raise serializers.ValidationError({"lesson_id": f"Lesson '{lesson_id}' not found."})

        # Self-reference check (only matters if list not empty)
        if normalized and lesson.lesson_id in normalized:
            raise serializers.ValidationError({"prerequisites": "A lesson cannot be a prerequisite of itself."})

        # Resolve referenced lessons (skip if we're clearing)
        found = {}
        if normalized:
            found = {l.lesson_id: l for l in Lesson.objects.filter(lesson_id__in=normalized)}
            missing = [lid for lid in normalized if lid not in found]
            if missing:
                raise serializers.ValidationError({"prerequisites": [f"Not found: {', '.join(missing)}"]})

        # Stash for view
        attrs["lesson"] = lesson
        attrs["prereq_list"] = [found[lid] for lid in normalized]  # empty list in clear-all case
        attrs["mode"] = mode  # ensure mode is present in validated_data
        return attrs

class LessonBulkCreateInSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=50)  # cap to prevent abuse
    credits = serializers.IntegerField(min_value=0) 
    base_title = serializers.CharField(required=False, allow_blank=True, default="Lesson")
    starting_number = serializers.IntegerField(min_value=1, required=False, default=1)
    duration_weeks = serializers.ChoiceField(choices=Lesson.DurationWeeks.choices, required=False, default=Lesson.DurationWeeks.FOUR)
    status = serializers.ChoiceField(choices=Lesson.LessonStatus.choices, required=False, default=Lesson.LessonStatus.ACTIVE)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    objectives = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class LessonItemsBulkSerializer(serializers.Serializer):
    items = serializers.CharField(allow_blank=True, allow_null=True, trim_whitespace=True)
    mode = serializers.ChoiceField(choices=["merge", "replace"], required=False, default="merge")

    def validate(self, attrs):
        mode = attrs.get("mode", "merge")
        items = (attrs.get("items") or "")  # coerce None→""
        if (not items.strip()) and mode != "replace":
            raise serializers.ValidationError(
                {"items": "Provide at least one line or use mode='replace' to clear."}
            )
        attrs["items"] = items  # keep normalized
        return attrs
"""
For showing assignments and readings in the fields
"""

class LessonReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonReading
        fields = ["reading_id", "lesson", "title", "url", "created_at", "updated_at"]
        read_only_fields = ["reading_id", "created_at", "updated_at"]

class LessonAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonAssignment
        fields = [
            "assignment_id",
            "lesson",
            "title",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["assignment_id", "created_at", "updated_at"]

class StudentLessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentLessonProgress
        fields = ["lesson", "student", "progress_percent"]
        read_only_fields = ["lesson", "student", "progress_percent"]
