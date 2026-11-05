"""Run: python manage.py test apps.identity.test_invitation_onboarding"""
import hashlib
from datetime import timedelta
from uuid import uuid4

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import PermissionDenied
from apps.identity.models import User, Farm, Role, Membership, Invitation
from apps.identity.services import register, create_farm
from apps.identity.access import Context

PASSWORD = "FieldWork-Blue-Sky-39!"


class InvitationOnboardingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = register({"email": "owner@example.com", "full_name": "Farm Owner", "password": PASSWORD})
        cls.farm = create_farm(cls.owner, {"name": "Test farm", "slug": "test-farm"})
        cls.worker_role = Role.objects.get(farm=cls.farm, code="worker")

    def setUp(self):
        self.client = APIClient()

    def invitation(self, email="worker@example.com", **changes):
        token = str(uuid4()) + str(uuid4())
        values = {"farm": self.farm, "email": email, "role": self.worker_role,
                  "token_hash": hashlib.sha256(token.encode()).hexdigest(),
                  "expires_at": timezone.now() + timedelta(days=7), "invited_by": self.owner}
        values.update(changes)
        return Invitation.objects.create(**values), token

    def signup(self, token, email="worker@example.com", **extra):
        return self.client.post("/api/v1/auth/register/", {"email": email, "full_name": "Worker",
            "password": PASSWORD, "account_mode": "invited", "invitation_code": token, **extra}, format="json")

    def test_invited_registration_joins_assigned_farm_without_creating_another(self):
        invitation, token = self.invitation()
        farms_before = Farm.objects.count()
        response = self.signup(token, email="Worker@Example.COM", role_id=str(Role.objects.get(farm=self.farm, code="owner").pk), is_staff=True)
        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(email="worker@example.com")
        membership = Membership.objects.get(user=user, farm=self.farm)
        self.assertEqual(membership.role_id, self.worker_role.pk)
        self.assertEqual(membership.status, "active")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(Farm.objects.count(), farms_before)
        self.assertNotIn("password", response.data)
        invitation.refresh_from_db()
        self.assertIsNotNone(invitation.accepted_at)

    def test_missing_code_rejected_before_user_creation(self):
        response = self.signup("")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="worker@example.com").exists())

    def test_invalid_code_rolls_back_account(self):
        response = self.signup("invalid-code")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="worker@example.com").exists())

    def test_wrong_email_rolls_back_account_and_keeps_invitation_unused(self):
        invitation, token = self.invitation()
        response = self.signup(token, email="other@example.com")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email="other@example.com").exists())
        invitation.refresh_from_db()
        self.assertIsNone(invitation.accepted_at)

    def test_expired_code_rolls_back_account(self):
        _, token = self.invitation(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.signup(token).status_code, 400)
        self.assertFalse(User.objects.filter(email="worker@example.com").exists())

    def test_inactive_farm_cannot_be_joined(self):
        _, token = self.invitation()
        Farm.objects.filter(pk=self.farm.pk).update(is_active=False)
        self.assertEqual(self.signup(token).status_code, 400)
        self.assertFalse(User.objects.filter(email="worker@example.com").exists())

    def test_existing_account_signs_in_and_accepts_instead_of_registering_again(self):
        user = register({"email": "worker@example.com", "full_name": "Existing", "password": PASSWORD})
        _, token = self.invitation()
        self.assertEqual(self.signup(token).status_code, 400)
        self.client.force_authenticate(user)
        response = self.client.post("/api/v1/auth/invitation/accept/", {"token": token}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Membership.objects.get(user=user, farm=self.farm).role_id, self.worker_role.pk)
        self.assertEqual(self.client.post("/api/v1/auth/invitation/accept/", {"token": token}, format="json").status_code, 400)

    def test_invitation_does_not_downgrade_existing_owner(self):
        invitation, token = self.invitation(email=self.owner.email)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post("/api/v1/auth/invitation/accept/", {"token": token}, format="json").status_code, 400)
        self.assertEqual(Membership.objects.get(farm=self.farm, user=self.owner).role.code, "owner")
        invitation.refresh_from_db()
        self.assertIsNone(invitation.accepted_at)

    def test_invitation_does_not_reactivate_suspended_membership(self):
        user = register({"email": "worker@example.com", "full_name": "Worker", "password": PASSWORD})
        Membership.objects.create(farm=self.farm, user=user, role=self.worker_role, status="suspended")
        _, token = self.invitation()
        self.client.force_authenticate(user)
        self.assertEqual(self.client.post("/api/v1/auth/invitation/accept/", {"token": token}, format="json").status_code, 400)
        self.assertEqual(Membership.objects.get(farm=self.farm, user=user).status, "suspended")

    def test_role_from_another_farm_is_rejected_atomically(self):
        other = Farm.objects.create(name="Other", slug="other")
        other_role = Role.objects.create(farm=other, code="worker", name="Worker")
        _, token = self.invitation(role=other_role)
        self.assertEqual(self.signup(token).status_code, 400)
        self.assertFalse(User.objects.filter(email="worker@example.com").exists())

    def test_worker_can_log_in_and_read_only_their_own_access(self):
        _, token = self.invitation()
        self.assertEqual(self.signup(token).status_code, 201)
        login = self.client.post("/api/v1/auth/token/", {"email": "worker@example.com", "password": PASSWORD}, format="json")
        self.assertEqual(login.status_code, 200, login.data)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + login.data["access"])
        response = self.client.get(f"/api/v1/farms/{self.farm.pk}/access/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["role"]["code"], "worker")
        self.assertIn("events.event.submit", response.data["permissions"])
        self.assertNotIn("events.event.confirm", response.data["permissions"])
        other = Farm.objects.create(name="Other", slug="unrelated")
        self.assertEqual(self.client.get(f"/api/v1/farms/{other.pk}/access/").status_code, 404)
        user = User.objects.get(email="worker@example.com")
        with self.assertRaises(PermissionDenied):
            Context.resolve(user, self.farm.pk).require("events.event.confirm")

    def test_legacy_owner_registration_still_works_without_code(self):
        response = self.client.post("/api/v1/auth/register/", {"email": "new-owner@example.com", "full_name": "New owner", "password": PASSWORD}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["joined_farm"])
        self.assertFalse(Membership.objects.filter(user__email="new-owner@example.com").exists())

    def test_accept_requires_a_validated_token_and_authentication(self):
        response = self.client.post("/api/v1/auth/invitation/accept/", {}, format="json")
        self.assertEqual(response.status_code, 401)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post("/api/v1/auth/invitation/accept/", {}, format="json").status_code, 400)

    def test_owner_can_change_role_and_remove_access_without_deleting_account(self):
        from apps.identity.services import change_member, remove_member
        user = register({"email": "member@example.com", "full_name": "Named Worker", "password": PASSWORD})
        member = Membership.objects.create(farm=self.farm, user=user, role=self.worker_role, status="active")
        ctx = Context.resolve(self.owner, self.farm.pk)
        viewer = Role.objects.get(farm=self.farm, code="viewer")
        change_member(ctx, member.pk, role_id=viewer.pk)
        remove_member(ctx, member.pk)
        member.refresh_from_db()
        self.assertEqual(member.role_id, viewer.pk)
        self.assertEqual(member.status, "suspended")
        self.assertTrue(User.objects.filter(pk=user.pk).exists())
        with self.assertRaises(Exception):
            Context.resolve(user, self.farm.pk)

    def test_final_active_owner_cannot_be_suspended_or_marked_invited(self):
        from apps.identity.services import change_member, remove_member
        from rest_framework.exceptions import ValidationError
        member = Membership.objects.get(farm=self.farm, user=self.owner)
        ctx = Context.resolve(self.owner, self.farm.pk)
        with self.assertRaises(ValidationError):
            remove_member(ctx, member.pk)
        with self.assertRaises(ValidationError):
            change_member(ctx, member.pk, status="invited")

    def test_worker_cannot_remove_members(self):
        from apps.identity.services import remove_member
        user = register({"email": "worker2@example.com", "full_name": "Worker", "password": PASSWORD})
        Membership.objects.create(farm=self.farm, user=user, role=self.worker_role, status="active")
        with self.assertRaises(PermissionDenied):
            remove_member(Context.resolve(user, self.farm.pk), Membership.objects.get(user=self.owner, farm=self.farm).pk)

    def test_named_members_and_recoverable_codes_are_permission_filtered(self):
        from apps.identity.services import invite, accept_invitation
        from apps.core.serializers import serializer_for
        ctx = Context.resolve(self.owner, self.farm.pk)
        member = Membership.objects.get(farm=self.farm, user=self.owner)
        value = serializer_for(Membership)(member, context={"ctx": ctx}).data
        self.assertEqual(value["member_name"], "Farm Owner")
        invitation, token = invite(ctx, "new@example.com", self.worker_role.pk)
        value = serializer_for(Invitation)(invitation, context={"ctx": ctx}).data
        self.assertEqual(value["invitation_code"], token)
        self.assertNotIn("token_hash", value)
        limited = Context(self.owner, self.farm, member, {"identity.invitation.view"})
        self.assertIsNone(serializer_for(Invitation)(invitation, context={"ctx": limited}).data["invitation_code"])
        new = register({"email": "new@example.com", "full_name": "New", "password": PASSWORD})
        accept_invitation(new, token)
        invitation.refresh_from_db()
        self.assertIsNone(serializer_for(Invitation)(invitation, context={"ctx": ctx}).data["invitation_code"])

    def test_manager_cannot_assign_owner_role(self):
        from apps.identity.services import change_member
        user = register({"email": "manager@example.com", "full_name": "Manager", "password": PASSWORD})
        member = Membership.objects.create(farm=self.farm, user=user, role=Role.objects.get(farm=self.farm, code="manager"), status="active")
        with self.assertRaises(PermissionDenied):
            change_member(Context.resolve(user, self.farm.pk), member.pk, role_id=Role.objects.get(farm=self.farm, code="owner").pk)
