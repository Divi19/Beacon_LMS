from django.test import TestCase

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

from api.models import InstructorProfile  
User = get_user_model()
class InstructorLoginTests(TestCase):
    def setUp(self):
        # Create a plain user and an instructor user
        self.password_ok = "pass12345!"

        self.user_only = User.objects.create(
            email="useronly@example.com",
            is_active=True,
            date_joined=timezone.now(),
        )
        self.user_only.set_password(self.password_ok)
        self.user_only.save()

        self.instructor_user = User.objects.create(
            email="instructor@example.com",
            is_active=True,
            date_joined=timezone.now(),
        )
        self.instructor_user.set_password(self.password_ok)
        self.instructor_user.save()

        self.instructor_profile = InstructorProfile.objects.create(
            user=self.instructor_user,
            full_name="Prof. Ada Lovelace",
            staff_no="S-001",
        )

        # If your urls.py names this view differently, change here:
        self.login_url = reverse("instructor-login")

    def _post_json(self, url, payload):
        return self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_login_success_for_instructor_returns_tokens_and_user_payload(self):
        res = self._post_json(self.login_url, {
            "email": "instructor@example.com",
            "password": self.password_ok,
        })
        self.assertEqual(res.status_code, 200, res.content)

        body = res.json()
        # Presence of tokens
        self.assertIn("access", body)
        self.assertIn("refresh", body)
        # Payload structure
        self.assertIn("user", body)
        self.assertEqual(body["user"]["full_name"], "Prof. Ada Lovelace")
        self.assertEqual(body["user"]["role"], "instructor")
        self.assertEqual(body["user"]["email"], "instructor@example.com")
        self.assertTrue(body["user"]["instructor_profile_id"])

    def test_login_forbidden_when_user_has_no_instructor_profile(self):
        res = self._post_json(self.login_url, {
            "email": "useronly@example.com",
            "password": self.password_ok,
        })
        self.assertEqual(res.status_code, 403, res.content)
        body = res.json()
        # view returns {"error": "Forbidden."}
        self.assertIn("error", body)

    def test_login_invalid_credentials_returns_400(self):
        res = self._post_json(self.login_url, {
            "email": "instructor@example.com",
            "password": "wrong-password",
        })
        # Most DRF serializers return 400 for invalid creds; if returns 401, change expected.
        self.assertIn(res.status_code, (400, 401), res.content)

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings

from api.auth import CustomJWTAuthentication  

User = get_user_model()


class CustomJWTAuthenticationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            email="authuser@example.com",
            is_active=True,
            date_joined=timezone.now(),
        )
        self.auth = CustomJWTAuthentication()

    def test_get_user_returns_user_when_token_has_valid_userid(self):
        # Build a fake validated token dict with USER_ID_CLAIM
        token = {api_settings.USER_ID_CLAIM: self.user.pk}
        got_user = self.auth.get_user(token)
        self.assertEqual(got_user.pk, self.user.pk)

    def test_get_user_raises_when_token_has_no_userid(self):
        with self.assertRaises(AuthenticationFailed) as ctx:
            self.auth.get_user({})
        self.assertIn("no recognizable user identification", str(ctx.exception))

    def test_get_user_raises_when_user_not_found(self):
        token = {api_settings.USER_ID_CLAIM: 999999}
        with self.assertRaises(AuthenticationFailed) as ctx:
            self.auth.get_user(token)
        self.assertIn("User not found", str(ctx.exception))
