# Standard Metrics API

Stripe revenue analytics + payment links API.

- **Base URL:** `https://standard-metrics.vercel.app`
- **Local dev:** `http://localhost:3003`
- **Swagger UI:** [`https://standard-metrics.vercel.app/api/docs`](https://standard-metrics.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-metrics.vercel.app/api/openapi.json`](https://standard-metrics.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-metrics.postman.json`](../postman/standard-metrics.postman.json)
- **TypeScript SDK:** `import { createStandardMetricsClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `GET` | `/api/cron/sync` |
| `GET` | `/api/docs` |
| `GET` | `/api/health` |
| `GET` | `/api/metrics/export` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/payment-links` |
| `POST` | `/api/payment-links` |
| `PATCH` | `/api/payment-links/{id}` |
| `DELETE` | `/api/payment-links/{id}` |
| `GET` | `/api/quota` |
| `POST` | `/api/quota` |
| `GET` | `/api/stripe/callback` |
| `GET` | `/api/stripe/connect` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### GET /api/cron/sync

```bash
curl \
  'https://standard-metrics.vercel.app/api/cron/sync'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/docs

```bash
curl \
  'https://standard-metrics.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-metrics.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/metrics/export

```bash
curl \
  'https://standard-metrics.vercel.app/api/metrics/export'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-metrics.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-metrics.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-metrics.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-metrics.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-metrics.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/payment-links

```bash
curl \
  'https://standard-metrics.vercel.app/api/payment-links'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/payment-links

```bash
curl \
  -X POST \
  'https://standard-metrics.vercel.app/api/payment-links' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/payment-links/{id}

```bash
curl \
  -X PATCH \
  'https://standard-metrics.vercel.app/api/payment-links/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### DELETE /api/payment-links/{id}

```bash
curl \
  -X DELETE \
  'https://standard-metrics.vercel.app/api/payment-links/<id>'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/quota

```bash
curl \
  'https://standard-metrics.vercel.app/api/quota'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/quota

```bash
curl \
  -X POST \
  'https://standard-metrics.vercel.app/api/quota' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/stripe/callback

```bash
curl \
  'https://standard-metrics.vercel.app/api/stripe/callback'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/stripe/connect

```bash
curl \
  'https://standard-metrics.vercel.app/api/stripe/connect'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-metrics.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-metrics.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-metrics.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-metrics.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-metrics.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-metrics.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-metrics.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-metrics.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
