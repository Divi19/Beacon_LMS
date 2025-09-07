from django.urls import path
from .import views
from django.urls import path
from .views import db_health
from django.contrib import admin
from django.urls import path, include
urlpatterns = [
    # path('', views.home, name='home'),
    path('courses/', views.course_creation, name="create_courses"),
    path("health/db/", db_health, name="db_health"),
]
