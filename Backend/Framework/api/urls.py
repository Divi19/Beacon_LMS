from django.urls import path
from .import views

urlpatterns = [
    # path('', views.home, name='home'),
    path('courses/', views.course_creation, name="create_courses")
]