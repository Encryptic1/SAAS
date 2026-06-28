# Standard Snippets API

Code snippets + versions + shares API.

- **Base URL:** `https://standard-snippets.vercel.app`
- **Local dev:** `http://localhost:3008`
- **Swagger UI:** [`https://standard-snippets.vercel.app/api/docs`](https://standard-snippets.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-snippets.vercel.app/api/openapi.json`](https://standard-snippets.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-snippets.postman.json`](../postman/standard-snippets.postman.json)
- **TypeScript SDK:** `import { createStandardSnippetsClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `GET` | `/api/docs` |
| `GET` | `/api/export/json` |
| `GET` | `/api/health` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/shared/{slug}` |
| `GET` | `/api/snippets` |
| `POST` | `/api/snippets` |
| `GET` | `/api/snippets/{id}` |
| `PATCH` | `/api/snippets/{id}` |
| `DELETE` | `/api/snippets/{id}` |
| `GET` | `/api/snippets/{id}/resolve` |
| `POST` | `/api/snippets/{id}/share` |
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
  'https://standard-snippets.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/export/json

```bash
curl \
  'https://standard-snippets.vercel.app/api/export/json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-snippets.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-snippets.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-snippets.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-snippets.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-snippets.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-snippets.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/shared/{slug}

```bash
curl \
  'https://standard-snippets.vercel.app/api/shared/<slug>'
```

**Path parameters:**
- `slug` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/snippets

```bash
curl \
  'https://standard-snippets.vercel.app/api/snippets'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/snippets

```bash
curl \
  -X POST \
  'https://standard-snippets.vercel.app/api/snippets' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/snippets/{id}

```bash
curl \
  'https://standard-snippets.vercel.app/api/snippets/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/snippets/{id}

```bash
curl \
  -X PATCH \
  'https://standard-snippets.vercel.app/api/snippets/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/snippets/{id}

```bash
curl \
  -X DELETE \
  'https://standard-snippets.vercel.app/api/snippets/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/snippets/{id}/resolve

```bash
curl \
  'https://standard-snippets.vercel.app/api/snippets/<id>/resolve'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/snippets/{id}/share

```bash
curl \
  -X POST \
  'https://standard-snippets.vercel.app/api/snippets/<id>/share' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-snippets.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-snippets.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-snippets.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-snippets.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-snippets.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-snippets.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-snippets.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-snippets.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
