# Farm owner, roles and worker logins

The existing backend supports farm membership, roles, permissions and invitations. A farm owner is not automatically a Django staff/superuser account.

## Practical setup

1. Farm owner opens Team & settings → Roles. Every new farm already has Owner, Manager, Supervisor, Worker, Accountant, Advisor and Viewer roles.
2. Prefer the built-in Worker role initially. For a custom role, use Create a custom role, with a new code such as `field_labour` (built-in role codes are reserved), then Set role permissions using valid backend permission codes. A role name alone does not grant access. You cannot grant permissions you do not hold; owner permissions are protected.
3. Open Invitations → Invite a team member. Enter the worker's email and select the role. The backend returns an invitation token; share it manually. This code path does not send an email automatically. Invitations expire after seven days.
4. The worker registers their own account with that exact email and logs in. Farm admin screens do not create a worker account/password directly.
5. The worker accepts the token while authenticated. The backend has this endpoint, but the current frontend does not have an invitation-acceptance page. Use Postman for this step:

```http
POST /api/v1/auth/invitation/accept/
Authorization: Bearer <worker-access-token>
Content-Type: application/json

{"token":"<invitation-token>"}
```

6. Refresh/reopen the frontend. The farm appears in the worker's accessible farms. The backend enforces their role permissions. Owners/authorised members can change a membership's role or suspend access. Optional Block access records can scope work to selected blocks.

## Resource versus account

A labourer/worker can exist as an Asset (class Person) with Person details for labour and cost recording, even without an application login. If they need to use the app, create their user/membership through registration and invitation; link the person resource to that member's user where appropriate.

The Worker role is intended for viewing relevant records, starting/submitting work and recording observations/files. Supervisor/manager roles cover broader operations according to the seeded permissions. Hiding a button is not the security boundary: backend permission checks remain authoritative.

These are explanations of existing backend behavior. This patch adds offline saving, not a new user-administration or invitation-acceptance interface.
