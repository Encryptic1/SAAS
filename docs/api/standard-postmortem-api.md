# Standard Postmortem API

Incidents + actions + recurrence API.

- **Base URL:** `https://standard-postmortem.vercel.app`
- **Local dev:** `http://localhost:3011`
- **Swagger UI:** [`https://standard-postmortem.vercel.app/api/docs`](https://standard-postmortem.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-postmortem.vercel.app/api/openapi.json`](https://standard-postmortem.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-postmortem.postman.json`](../postman/standard-postmortem.postman.json)
- **TypeScript SDK:** `import { createStandardPostmortemClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `PATCH` | `/api/actions/{actionId}` |
| `DELETE` | `/api/actions/{actionId}` |
| `GET` | `/api/docs` |
| `GET` | `/api/health` |
| `GET` | `/api/incidents` |
| `POST` | `/api/incidents` |
| `GET` | `/api/incidents/{id}` |
| `PATCH` | `/api/incidents/{id}` |
| `DELETE` | `/api/incidents/{id}` |
| `POST` | `/api/incidents/{id}/actions` |
| `POST` | `/api/incidents/{id}/embed` |
| `POST` | `/api/incidents/{id}/links` |
| `POST` | `/api/intake` |
| `DELETE` | `/api/links/{linkId}` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/recurrence` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### PATCH /api/actions/{actionId}

```bash
curl \
  -X PATCH \
  'https://standard-postmortem.vercel.app/api/actions/<actionId>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `actionId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/actions/{actionId}

```bash
curl \
  -X DELETE \
  'https://standard-postmortem.vercel.app/api/actions/<actionId>'
```

**Path parameters:**
- `actionId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/docs

```bash
curl \
  'https://standard-postmortem.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-postmortem.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/incidents

```bash
curl \
  'https://standard-postmortem.vercel.app/api/incidents'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/incidents

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/incidents' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/incidents/{id}

```bash
curl \
  'https://standard-postmortem.vercel.app/api/incidents/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/incidents/{id}

```bash
curl \
  -X PATCH \
  'https://standard-postmortem.vercel.app/api/incidents/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/incidents/{id}

```bash
curl \
  -X DELETE \
  'https://standard-postmortem.vercel.app/api/incidents/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/incidents/{id}/actions

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/incidents/<id>/actions' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/incidents/{id}/embed

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/incidents/<id>/embed' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/incidents/{id}/links

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/incidents/<id>/links' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/intake

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/intake' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/links/{linkId}

```bash
curl \
  -X DELETE \
  'https://standard-postmortem.vercel.app/api/links/<linkId>'
```

**Path parameters:**
- `linkId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-postmortem.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-postmortem.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-postmortem.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-postmortem.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/recurrence

```bash
curl \
  'https://standard-postmortem.vercel.app/api/recurrence'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-postmortem.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-postmortem.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-postmortem.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-postmortem.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-postmortem.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-postmortem.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
