# 🏮 Beacon LMS

> A full-stack Learning Management System built with **Django REST Framework** and **React**, engineered for institutional-scale course delivery with role-based access control, real-time progress analytics, and multi-session classroom scheduling.

[![Django](https://img.shields.io/badge/Django-5.2-green?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![DRF](https://img.shields.io/badge/DRF-3.16-red?style=flat-square)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-yellow?style=flat-square)](https://jwt.io/)

---

## 📌 Project Overview

Beacon LMS is a production-grade Learning Management System designed for institutions managing multiple instructors, courses, lessons, classrooms, and student cohorts. The system exposes a clean REST API consumed by a standalone React SPA, with three distinct actor roles: **Admin**, **Instructor**, and **Student**.

Key architectural goals:
- **Separation of concerns** between the Django API backend and the React frontend via a clearly defined REST contract
- **Algorithmic efficiency** in progress reporting using Django ORM annotations (`Count`, `Sum`, `ExpressionWrapper`, `Coalesce`) to compute all aggregates in a single database round-trip
- **Data integrity** enforced at the model layer via atomic transactions, `select_for_update`, and custom `clean()` validation
- **Deployed on Render** with PostgreSQL, Gunicorn, and WhiteNoise for static file serving

---

## ✨ Core Features

### 👤 Role-Based Access Control
- Three distinct roles: **Admin**, **Instructor**, and **Student**
- Role-aware JWT payload on login; each role has its own authentication endpoint
- Custom `CustomJWTAuthentication` class maps JWT `user_id` claim directly to the app's `User` model (bypassing Django's built-in auth model)

### 📚 Course & Lesson Management
- Instructors create and manage courses; lessons are scoped within courses
- **Bulk lesson creation** with conflict-safe, padded numeric ID generation (e.g., `CL-LES001`)
- Lesson credit cap enforced at the model layer: credits across all lessons in a course cannot exceed the course's credit limit, using `select_for_update` to prevent race conditions
- Prerequisite chains: instructors define lesson dependencies via a dedicated `LessonPrerequisite` model

### 🏫 Classroom Scheduling
- Support for both **physical** and **online (Zoom)** classrooms
- `LessonClassroom` scheduling enforces **no double-booking** for rooms or supervisors on the same day/time using overlap queries at save time
- `ActiveLessonClassroomManager` custom manager transparently filters out expired sessions using `expires_at`
- Session expiry is automatically computed from `duration_weeks` at creation time

### 📊 Progress Analytics Engine
- Course-level, lesson-level, and student-level progress computed entirely via single ORM queries with chained `.annotate()` calls
- Metrics computed: `avg_percentages`, `lessons_completed`, `credits_earned`, `avg_progress`, `lesson_progress_percentage`
- `utils.py` hosts reusable helper functions (`get_course_progress`, `compute_lesson_progress`, `compute_student_singular`) for DRY, testable analytics logic
- `StudentLessonProgress` model persists computed progress, updated transactionally on any assignment/reading completion

### 🎓 Student Workflows
- Self-service course enrollment, lesson enrollment, and classroom slot selection
- Per-student assignment checklist tracking (`StudentAssignmentProgress`) and reading checklist tracking (`StudentReadingProgress`)
- `LessonEnrollment.check_completion()` auto-marks a lesson complete when all tasks are done and the lesson duration has elapsed
- Student profile includes progress reports per course and per lesson

### 🔐 Authentication
- Stateless JWT authentication via `djangorestframework-simplejwt`
- Token blacklisting on logout
- Rotating refresh tokens

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Django 5.2, Django REST Framework 3.16 |
| **Authentication** | SimpleJWT (djangorestframework-simplejwt 5.5) |
| **Database** | PostgreSQL (psycopg2-binary), SQLite for tests |
| **Frontend** | React 19, React Router DOM v7 |
| **HTTP Client** | Axios 1.x |
| **Static Files** | WhiteNoise |
| **Deployment** | Render (Backend + Frontend), Gunicorn |
| **Config** | python-dotenv, dj-database-url, django-environ |
| **CORS** | django-cors-headers |
| **Testing** | Django TestCase, DRF APITestCase |

---

## 🗂 Project Structure

```
Beacon_LMS/
├── Backend/
│   └── Framework/
│       ├── api/
│       │   ├── models.py        # 15 Django ORM models with full validation
│       │   ├── views.py         # 2100+ lines of class-based APIViews
│       │   ├── serializers.py   # DRF serializers for all models
│       │   ├── urls.py          # API URL routing
│       │   ├── auth.py          # Custom JWT authentication backend
│       │   ├── utils.py         # Reusable ORM query helpers (progress engine)
│       │   └── tests.py         # Unit tests for models & serializers
│       └── backend/
│           ├── settings.py      # Environment-aware Django settings
│           └── urls.py          # Root URL configuration
├── Frontend/
│   └── beacon-react-app/
│       └── src/
│           ├── App.js           # Route definitions (30+ routes across 3 roles)
│           ├── api.js           # Axios base instance
│           ├── pages/           # Role-scoped page components
│           │   ├── Admin/
│           │   ├── Instructor/
│           │   └── Student/
│           ├── components/      # Shared UI components
│           └── state/           # Application state management
├── requirements.txt
└── Pipfile
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Beacon_LMS.git
cd Beacon_LMS
```

### 2. Backend Setup
```bash
cd Backend/Framework

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../../requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set: DATABASE_URL, SECRET_KEY, DEBUG
```

**Sample `.env`:**
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/beacon_lms
```

```bash
# Run migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/`.

### 3. Frontend Setup
```bash
cd Frontend/beacon-react-app

# Install Node dependencies
npm install

# Start the React development server
npm start
```

The frontend will be available at `http://localhost:3000/`.

### 4. Running Tests
```bash
# From Backend/Framework
cd Backend/Framework
python manage.py test api
```

---

## 🚀 Usage

### API Endpoints Summary

| Actor | Endpoint | Description |
|---|---|---|
| **Auth** | `POST /instructor/login/` | Instructor JWT login |
| **Auth** | `POST /student/login/` | Student JWT login |
| **Auth** | `POST /api/admin/login/` | Admin JWT login |
| **Auth** | `POST /user/logout/` | Blacklist refresh token |
| **Student** | `POST /student/signup/` | Self-registration |
| **Student** | `GET /student/my_courses/` | Enrolled courses with progress |
| **Student** | `GET /student/courses/<id>/lessons/enrolled/` | Enrolled lessons with progress |
| **Student** | `GET /student/lessons/<id>/assignments/` | Assignment checklist |
| **Instructor** | `GET /instructor/courses/` | Own courses with cohort analytics |
| **Instructor** | `POST /instructor/courses/<id>/lessons/bulk-create/` | Bulk create lessons |
| **Instructor** | `GET /instructor/course/progress/<id>/` | Detailed course progress report |
| **Instructor** | `GET /instructor/lesson/progress/<id>/` | Per-lesson progress report |
| **Instructor** | `GET /instructor/student/progress/<id>/` | Per-student progress report |
| **Admin** | `GET /api/admin/instructors/` | List & manage instructors |

### Authentication Flow

All protected endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

Tokens are obtained from role-specific login endpoints and rotated automatically.

---

## 🏗 Architecture Notes

### ORM-First Analytics
Rather than computing progress in Python, all analytics are resolved at the database layer as annotated querysets. This approach scales to thousands of enrolled students without N+1 query issues:

```python
# Example: Course progress computed in a single query
courses.annotate(
    sum_completed=Count('lesson__lessonenrollment', filter=Q(status='Completed')),
    avg_completed=_ratio(F('sum_completed'), F('enrolled_count')),
    avg_progress=_ratio(avg_completed, F('tot_lessons')),
    avg_percentages=ExpressionWrapper(avg_progress * 100.0, output_field=FloatField())
)
```

### Transactional Integrity
Lesson credit allocation uses `select_for_update()` inside `transaction.atomic()` to prevent over-allocation under concurrent writes:

```python
def save(self, *args, **kwargs):
    with transaction.atomic():
        Course.objects.select_for_update().get(pk=self.course_id)
        self.full_clean()  # Validates credit cap
        return super().save(*args, **kwargs)
```

### Custom Manager Pattern
`ActiveLessonClassroomManager` encapsulates the "not expired" filter, keeping views clean and ensuring the business rule is applied consistently:

```python
class ActiveLessonClassroomManager(models.Manager):
    def get_queryset(self):
        now = timezone.now()
        return super().get_queryset().filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.