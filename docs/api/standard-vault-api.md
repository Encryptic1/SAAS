# Standard Vault API

Secrets + projects + tokens API.

- **Base URL:** `https://standard-vault.vercel.app`
- **Local dev:** `http://localhost:3006`
- **Swagger UI:** [`https://standard-vault.vercel.app/api/docs`](https://standard-vault.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-vault.vercel.app/api/openapi.json`](https://standard-vault.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-vault.postman.json`](../postman/standard-vault.postman.json)
- **TypeScript SDK:** `import { createStandardVaultClient } from "@market-standard/api-client"`

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
| `GET` | `/api/projects` |
| `POST` | `/api/projects` |
| `GET` | `/api/projects/{id}` |
| `PATCH` | `/api/projects/{id}` |
| `DELETE` | `/api/projects/{id}` |
| `GET` | `/api/projects/{id}/audit` |
| `POST` | `/api/projects/{id}/decrypt` |
| `GET` | `/api/projects/{id}/dotenv` |
| `POST` | `/api/projects/{id}/import` |
| `GET` | `/api/projects/{id}/inject` |
| `GET` | `/api/projects/{id}/references` |
| `GET` | `/api/projects/{id}/secrets` |
| `POST` | `/api/projects/{id}/secrets` |
| `GET` | `/api/projects/{id}/tokens` |
| `POST` | `/api/projects/{id}/tokens` |
| `PATCH` | `/api/secrets/{id}` |
| `DELETE` | `/api/secrets/{id}` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/tokens/{id}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### GET /api/docs

```bash
curl \
  'https://standard-vault.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-vault.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-vault.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-vault.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-vault.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-vault.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects

```bash
curl \
  'https://standard-vault.vercel.app/api/projects'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/projects

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/projects' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/projects/{id}

```bash
curl \
  -X PATCH \
  'https://standard-vault.vercel.app/api/projects/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/projects/{id}

```bash
curl \
  -X DELETE \
  'https://standard-vault.vercel.app/api/projects/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}/audit

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>/audit'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/projects/{id}/decrypt

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/projects/<id>/decrypt' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}/dotenv

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>/dotenv'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/projects/{id}/import

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/projects/<id>/import' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}/inject

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>/inject'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}/references

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>/references'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}/secrets

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>/secrets'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/projects/{id}/secrets

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/projects/<id>/secrets' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/projects/{id}/tokens

```bash
curl \
  'https://standard-vault.vercel.app/api/projects/<id>/tokens'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/projects/{id}/tokens

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/projects/<id>/tokens' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/secrets/{id}

```bash
curl \
  -X PATCH \
  'https://standard-vault.vercel.app/api/secrets/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/secrets/{id}

```bash
curl \
  -X DELETE \
  'https://standard-vault.vercel.app/api/secrets/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-vault.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-vault.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-vault.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-vault.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-vault.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/tokens/{id}

```bash
curl \
  -X DELETE \
  'https://standard-vault.vercel.app/api/tokens/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-vault.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
