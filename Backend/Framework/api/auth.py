# auth.py
#Crucial for custom authentication methods, grabbing user information when perfoming behaviours beyond login 
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from .models import User

#Grabbing user info from tokens
class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        res = super().authenticate(request)   # parses/validates header; returns (user, token) or None
        if res is None:
            return None                  
        validated = res[1]
        return (self.get_user(validated), validated)
    
    def get_user(self, validated_token):
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)
        if user_id is None:
            raise AuthenticationFailed("Token contained no recognizable user identification", code="token_no_user")
        try:
            #PK field is user_id
            return User.objects.get(user_id=user_id, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")
