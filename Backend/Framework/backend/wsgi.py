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

# ======= Auto-create superuser from environment variables (only if not exists) =======
# Set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, and DJANGO_SUPERUSER_PASSWORD
# in your .env file (or hosting dashboard) to enable automatic superuser creation.
# If any of these variables are missing, the block is skipped safely.
try:
    from django.contrib.auth import get_user_model
    import os

    _su_username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
    _su_email    = os.environ.get("DJANGO_SUPERUSER_EMAIL")
    _su_password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

    if _su_username and _su_email and _su_password:
        User = get_user_model()
        if not User.objects.filter(username=_su_username).exists():
            User.objects.create_superuser(
                username=_su_username,
                email=_su_email,
                password=_su_password,
            )
            print(f"Superuser '{_su_username}' created.")
        else:
            print(f"Superuser '{_su_username}' already exists. Skipping.")
    else:
        print("DJANGO_SUPERUSER_* env vars not set — skipping superuser creation.")
except Exception as e:
    # Prevent errors from breaking the WSGI app startup
    print(f"Skipping superuser creation: {e}")
