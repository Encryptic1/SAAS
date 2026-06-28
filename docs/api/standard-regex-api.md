# Standard Regex API

Regex patterns + forks API.

- **Base URL:** `https://standard-regex.vercel.app`
- **Local dev:** `http://localhost:3010`
- **Swagger UI:** [`https://standard-regex.vercel.app/api/docs`](https://standard-regex.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-regex.vercel.app/api/openapi.json`](https://standard-regex.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-regex.postman.json`](../postman/standard-regex.postman.json)
- **TypeScript SDK:** `import { createStandardRegexClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `GET` | `/api/docs` |
| `GET` | `/api/health` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/patterns` |
| `POST` | `/api/patterns` |
| `GET` | `/api/patterns/{id}` |
| `POST` | `/api/patterns/{id}` |
| `PATCH` | `/api/patterns/{id}` |
| `DELETE` | `/api/patterns/{id}` |
| `POST` | `/api/patterns/test` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### GET /api/docs

```bash
curl \
  'https://standard-regex.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-regex.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-regex.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-regex.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-regex.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-regex.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/patterns

```bash
curl \
  'https://standard-regex.vercel.app/api/patterns'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/patterns

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/patterns' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/patterns/{id}

```bash
curl \
  'https://standard-regex.vercel.app/api/patterns/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/patterns/{id}

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/patterns/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/patterns/{id}

```bash
curl \
  -X PATCH \
  'https://standard-regex.vercel.app/api/patterns/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/patterns/{id}

```bash
curl \
  -X DELETE \
  'https://standard-regex.vercel.app/api/patterns/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/patterns/test

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/patterns/test' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-regex.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-regex.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-regex.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-regex.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-regex.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-regex.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
