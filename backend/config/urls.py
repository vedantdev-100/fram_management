from apps.core.sync import SyncView
from apps.core.views import BoundaryImportView, BoundaryExportView
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.identity.views import (
    RegisterView,
    FarmAccessView,
    MeView,
    LogoutView,
    FarmsView,
    AcceptInvitationView,
    PasswordResetView,
    PasswordResetConfirmView,
)
from apps.core.views import (
    resource_view,
    CommandView,
    ReportView,
    HealthView,
    ReadinessView,
    AttachmentUploadView,
    AttachmentDownloadView,
)
from apps.core.resources import RESOURCES

router = DefaultRouter()
for name, label in RESOURCES.items():
    router.register(name, resource_view(name, label), basename=name)

urlpatterns = [
    path("api/v1/farms/<uuid:farm_id>/access/", FarmAccessView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/sync/", SyncView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/boundaries/import-preview/", BoundaryImportView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/boundaries/export/", BoundaryExportView.as_view()),
    path("admin/", admin.site.urls),
    path("health/", HealthView.as_view()),
    path("ready/", ReadinessView.as_view()),
    path("api/v1/auth/register/", RegisterView.as_view()),
    path("api/v1/auth/token/", TokenObtainPairView.as_view()),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view()),
    path("api/v1/auth/logout/", LogoutView.as_view()),
    path("api/v1/auth/me/", MeView.as_view()),
    path("api/v1/auth/invitation/accept/", AcceptInvitationView.as_view()),
    path("api/v1/auth/password-reset/", PasswordResetView.as_view()),
    path("api/v1/auth/password-reset/confirm/", PasswordResetConfirmView.as_view()),
    path("api/v1/farms/", FarmsView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/commands/<str:command>/", CommandView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/reports/<str:name>/", ReportView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/files/upload/", AttachmentUploadView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/files/<uuid:pk>/download/", AttachmentDownloadView.as_view()),
    path("api/v1/farms/<uuid:farm_id>/", include(router.urls)),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
]
