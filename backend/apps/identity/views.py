from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import ScopedRateThrottle
from .models import User, Farm, Membership
from .services import register, create_farm, accept_invitation
from apps.core.serializers import serializer_for


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=200)
    password = serializers.CharField(write_only=True, min_length=8)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        u = register(s.validated_data)
        return Response({"id": str(u.pk), "email": u.email, "full_name": u.full_name}, status=201)


class MeView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(
            {
                "id": str(request.user.pk),
                "email": request.user.email,
                "full_name": request.user.full_name,
                "memberships": list(
                    Membership.objects.filter(user=request.user, status="active").values(
                        "farm_id", "farm__name", "role__code"
                    )
                ),
            }
        )


class LogoutView(APIView):
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        token = RefreshToken(request.data["refresh"])
        if str(token["user_id"]) != str(request.user.pk):
            raise serializers.ValidationError("Token does not belong to this user.")
        token.blacklist()
        return Response(status=204)


class FarmsView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        farms = Farm.objects.filter(
            id__in=Membership.objects.filter(user=request.user, status="active").values("farm_id")
        )
        from .access import Context

        return Response(
            [
                serializer_for(Farm)(f, context={"ctx": Context.resolve(request.user, f.pk)}).data
                for f in farms
                if not f.pending_deletion_at
            ]
        )

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        s = serializer_for(Farm)(data=request.data)
        s.is_valid(raise_exception=True)
        farm = create_farm(request.user, s.validated_data)
        return Response(serializer_for(Farm)(farm).data, status=201)


class AcceptInvitationView(APIView):
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        row = accept_invitation(request.user, request.data["token"])
        return Response({"farm_id": str(row.farm_id)})


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        email = str(request.data.get("email", "")).lower()
        u = User.objects.filter(email=email, is_active=True).first()
        if u:
            uid = urlsafe_base64_encode(force_bytes(u.pk))
            token = default_token_generator.make_token(u)
            send_mail(
                "Password reset",
                f"Use uid={uid} and token={token} at /api/v1/auth/password-reset/confirm/.",
                settings.DEFAULT_FROM_EMAIL,
                [u.email],
            )
        return Response({"detail": "If the account exists, reset instructions were sent."})


class PasswordResetConfirmView(PasswordResetView):
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        try:
            u = User.objects.get(pk=urlsafe_base64_decode(request.data["uid"]).decode())
        except Exception:
            raise serializers.ValidationError("Invalid reset token.")
        if not default_token_generator.check_token(u, request.data["token"]):
            raise serializers.ValidationError("Invalid reset token.")
        password = request.data["password"]
        validate_password(password, u)
        u.set_password(password)
        u.save()
        return Response({"detail": "Password changed."})
