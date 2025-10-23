"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()

# ======= Auto-create superuser (only if not exists) =======
try:
    import django
    django.setup()
    from django.contrib.auth import get_user_model

    User = get_user_model()
    USERNAME = "admin"
    EMAIL = "admin@example.com"
    PASSWORD = "SuperSecretPassword123"

    if not User.objects.filter(username=USERNAME).exists():
        User.objects.create_superuser(username=USERNAME, email=EMAIL, password=PASSWORD)
        print("Superuser created")
except Exception as e:
    # Prevent errors from breaking the WSGI app
    print(f"Skipping superuser creation: {e}")
