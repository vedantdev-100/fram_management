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
from .services import register, register_with_invitation, create_farm, accept_invitation
from apps.core.serializers import serializer_for


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=200)
    password = serializers.CharField(write_only=True, min_length=8)
    account_mode = serializers.ChoiceField(choices=["owner", "invited"], default="owner")
    invitation_code = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=512)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists. Sign in and accept the invitation instead.")
        return value

    def validate(self, attrs):
        code = attrs.get("invitation_code", "").strip()
        if attrs["account_mode"] == "invited" and not code:
            raise serializers.ValidationError({"invitation_code": "Enter the invitation code supplied by your farm administrator."})
        if attrs["account_mode"] == "owner" and code:
            raise serializers.ValidationError({"invitation_code": "Select Join a farm to use this invitation."})
        attrs["invitation_code"] = code
        return attrs


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=RegisterSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = dict(s.validated_data)
        mode = data.pop("account_mode")
        token = data.pop("invitation_code", "")
        invitation = None
        if mode == "invited":
            u, invitation = register_with_invitation(data, token)
        else:
            u = register(data)
        return Response({
            "id": str(u.pk), "email": u.email, "full_name": u.full_name,
            "account_mode": mode,
            "joined_farm": {"id": str(invitation.farm_id), "role": invitation.role.code} if invitation else None,
        }, status=201)


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


class InvitationAcceptSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, max_length=512)


class AcceptInvitationView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=InvitationAcceptSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = InvitationAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        row = accept_invitation(request.user, serializer.validated_data["token"])
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


class FarmAccessView(APIView):
    """Expose only the current authenticated member's effective role capabilities."""
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, farm_id):
        from .access import Context
        ctx = Context.resolve(request.user, farm_id)
        return Response({
            "farm_id": str(ctx.farm.pk),
            "membership_id": str(ctx.membership.pk),
            "role": {"id": str(ctx.membership.role_id), "code": ctx.membership.role.code, "name": ctx.membership.role.name},
            "permissions": sorted(ctx.permissions),
        })
