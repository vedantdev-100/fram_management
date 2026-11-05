# Invitation API examples

Paths are relative to `http://127.0.0.1:8000`. Use `Content-Type: application/json`. Authenticated requests require `Authorization: Bearer <access token>`.

## 1. Admin: find the farm's worker role

`GET /api/v1/farms/<farm_id>/roles/`

Use the `id` of the role whose `code` is `worker`. Do not send the literal word `worker` as `role_id`.

## 2. Admin: create the invitation (existing endpoint)

`POST /api/v1/farms/<farm_id>/commands/invite/`

```json
{"email":"test@gmail.com","role_id":"<worker-role-uuid>"}
```

The existing command returns the invitation record and plaintext token. The generic command result panel displays the result. Share that token privately; only its hash is stored in the invitation record.

## 3. New worker: register and accept together

`POST /api/v1/auth/register/` — public

```json
{
  "email":"test@gmail.com",
  "full_name":"Farm worker",
  "password":"<worker chooses a strong password>",
  "account_mode":"invited",
  "invitation_code":"<token from step 2>"
}
```

Success: HTTP 201 with account fields, `account_mode` and `joined_farm: {id, role}`. It does not return JWTs. The frontend confirms the password locally and sends only `password`. Supplying `role_id`, staff flags or a farm ID cannot override the invitation's role/farm.

Failure: HTTP 400 using the project's existing error envelope. A failed invited registration rolls back the account. An email already registered must use the existing-user flow below.

## 4. Worker: sign in normally

`POST /api/v1/auth/token/` — public

```json
{"email":"test@gmail.com","password":"<chosen password>"}
```

Use the returned `access` JWT. Existing `/api/v1/auth/me/` and `/api/v1/farms/` then return the account and accessible farms.

## 5. Frontend: load current farm capabilities (new endpoint)

`GET /api/v1/farms/<farm_id>/access/` — authenticated active member

```json
{
  "farm_id":"<farm-uuid>",
  "membership_id":"<membership-uuid>",
  "role":{"id":"<role-uuid>","code":"worker","name":"Worker"},
  "permissions":["events.event.start","events.event.submit"]
}
```

The actual permission array contains the full sorted effective permission set, not just the two illustrative values above. Another farm's member cannot read this response. This endpoint exposes the caller's own capabilities and does not require permission to manage team members.

## Existing account: accept after sign-in

`POST /api/v1/auth/invitation/accept/` — authenticated

```json
{"token":"<invitation code>"}
```

Success: HTTP 200, `{"farm_id":"<farm-uuid>"}`. This preserves the existing `token` field name for Postman compatibility. Expired/used/wrong-email codes return 400; no token returns 400; no authentication returns 401. Active members with a different role and suspended members must have their access changed separately by an administrator.

## Owner registration

`POST /api/v1/auth/register/` — public

```json
{
  "email":"owner@example.com",
  "full_name":"Farm owner",
  "password":"<chosen password>",
  "account_mode":"owner"
}
```

Owner signup creates an account, not a farm. After login, choose to create your farm. Older registration clients omitting `account_mode` still use this owner flow. An invitation code must not be supplied with owner mode.
