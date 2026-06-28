# Standard Workspace API

Sessions + health checks + tunnels + depsync API.

- **Base URL:** `https://standard-workspace.vercel.app`
- **Local dev:** `http://localhost:3014`
- **Swagger UI:** [`https://standard-workspace.vercel.app/api/docs`](https://standard-workspace.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-workspace.vercel.app/api/openapi.json`](https://standard-workspace.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-workspace.postman.json`](../postman/standard-workspace.postman.json)
- **TypeScript SDK:** `import { createStandardWorkspaceClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `GET` | `/api/depsync` |
| `GET` | `/api/docs` |
| `GET` | `/api/health` |
| `POST` | `/api/health/run` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/sessions` |
| `POST` | `/api/sessions` |
| `GET` | `/api/sessions/{id}/logs` |
| `POST` | `/api/sessions/{id}/stop` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `GET` | `/api/tunnels` |
| `POST` | `/api/tunnels` |
| `PATCH` | `/api/tunnels/{id}` |
| `DELETE` | `/api/tunnels/{id}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### GET /api/depsync

```bash
curl \
  'https://standard-workspace.vercel.app/api/depsync'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/docs

```bash
curl \
  'https://standard-workspace.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-workspace.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/health/run

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/health/run' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-workspace.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-workspace.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-workspace.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-workspace.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/sessions

```bash
curl \
  'https://standard-workspace.vercel.app/api/sessions'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/sessions

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/sessions' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/sessions/{id}/logs

```bash
curl \
  'https://standard-workspace.vercel.app/api/sessions/<id>/logs'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/sessions/{id}/stop

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/sessions/<id>/stop' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-workspace.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-workspace.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-workspace.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-workspace.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-workspace.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/tunnels

```bash
curl \
  'https://standard-workspace.vercel.app/api/tunnels'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/tunnels

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/tunnels' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/tunnels/{id}

```bash
curl \
  -X PATCH \
  'https://standard-workspace.vercel.app/api/tunnels/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/tunnels/{id}

```bash
curl \
  -X DELETE \
  'https://standard-workspace.vercel.app/api/tunnels/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-workspace.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
