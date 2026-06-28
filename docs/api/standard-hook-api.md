# Standard Hook API

Webhook inbox capture + replay API.

- **Base URL:** `https://standard-hook.vercel.app`
- **Local dev:** `http://localhost:3004`
- **Swagger UI:** [`https://standard-hook.vercel.app/api/docs`](https://standard-hook.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-hook.vercel.app/api/openapi.json`](https://standard-hook.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-hook.postman.json`](../postman/standard-hook.postman.json)
- **TypeScript SDK:** `import { createStandardHookClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `GET` | `/api/capture/{slug}` |
| `POST` | `/api/capture/{slug}` |
| `PATCH` | `/api/capture/{slug}` |
| `PUT` | `/api/capture/{slug}` |
| `DELETE` | `/api/capture/{slug}` |
| `GET` | `/api/docs` |
| `POST` | `/api/events/{id}/replay` |
| `GET` | `/api/health` |
| `GET` | `/api/inboxes` |
| `POST` | `/api/inboxes` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### GET /api/capture/{slug}

```bash
curl \
  'https://standard-hook.vercel.app/api/capture/<slug>'
```

**Path parameters:**
- `slug` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/capture/{slug}

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/capture/<slug>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `slug` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/capture/{slug}

```bash
curl \
  -X PATCH \
  'https://standard-hook.vercel.app/api/capture/<slug>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `slug` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PUT /api/capture/{slug}

```bash
curl \
  -X PUT \
  'https://standard-hook.vercel.app/api/capture/<slug>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `slug` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/capture/{slug}

```bash
curl \
  -X DELETE \
  'https://standard-hook.vercel.app/api/capture/<slug>'
```

**Path parameters:**
- `slug` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/docs

```bash
curl \
  'https://standard-hook.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/events/{id}/replay

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/events/<id>/replay' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-hook.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/inboxes

```bash
curl \
  'https://standard-hook.vercel.app/api/inboxes'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/inboxes

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/inboxes' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-hook.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-hook.vercel.app/api/notifications/<id>/read' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications/read-all

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-hook.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-hook.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-hook.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-hook.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-hook.vercel.app/api/team/<teamId>/members/<memberId>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X DELETE \
  'https://standard-hook.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-hook.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
