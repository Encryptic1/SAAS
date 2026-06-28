# Standard Lens API

Query library + slow queries + EXPLAIN API.

- **Base URL:** `https://standard-lens.vercel.app`
- **Local dev:** `http://localhost:3012`
- **Swagger UI:** [`https://standard-lens.vercel.app/api/docs`](https://standard-lens.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-lens.vercel.app/api/openapi.json`](https://standard-lens.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-lens.postman.json`](../postman/standard-lens.postman.json)
- **TypeScript SDK:** `import { createStandardLensClient } from "@market-standard/api-client"`

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
| `GET` | `/api/queries` |
| `POST` | `/api/queries` |
| `GET` | `/api/queries/{id}` |
| `PATCH` | `/api/queries/{id}` |
| `DELETE` | `/api/queries/{id}` |
| `POST` | `/api/queries/explain` |
| `GET` | `/api/slow` |
| `POST` | `/api/slow` |
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
  'https://standard-lens.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-lens.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-lens.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-lens.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-lens.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-lens.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/queries

```bash
curl \
  'https://standard-lens.vercel.app/api/queries'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/queries

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/queries' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/queries/{id}

```bash
curl \
  'https://standard-lens.vercel.app/api/queries/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/queries/{id}

```bash
curl \
  -X PATCH \
  'https://standard-lens.vercel.app/api/queries/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/queries/{id}

```bash
curl \
  -X DELETE \
  'https://standard-lens.vercel.app/api/queries/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/queries/explain

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/queries/explain' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/slow

```bash
curl \
  'https://standard-lens.vercel.app/api/slow'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/slow

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/slow' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-lens.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-lens.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-lens.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-lens.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-lens.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-lens.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
