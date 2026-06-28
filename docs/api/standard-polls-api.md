# Standard Polls API

Polls + Slack standup bot API.

- **Base URL:** `https://standard-polls.vercel.app`
- **Local dev:** `http://localhost:3001`
- **Swagger UI:** [`https://standard-polls.vercel.app/api/docs`](https://standard-polls.vercel.app/api/docs)
- **OpenAPI JSON:** [`https://standard-polls.vercel.app/api/openapi.json`](https://standard-polls.vercel.app/api/openapi.json)
- **Postman collection:** [`docs/postman/standard-polls.postman.json`](../postman/standard-polls.postman.json)
- **TypeScript SDK:** `import { createStandardPollsClient } from "@market-standard/api-client"`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (`/api/webhooks/stripe`, `/api/slack/events`, etc.) verify signatures
instead. Cron endpoints (`/api/cron/*`) require a `CRON_SECRET` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
| `GET` | `/api/cron/digest` |
| `POST` | `/api/cron/digest` |
| `POST` | `/api/cron/standup` |
| `POST` | `/api/cron/standup-digest` |
| `GET` | `/api/dev/mock-install` |
| `POST` | `/api/dev/poll` |
| `GET` | `/api/digest/config` |
| `PATCH` | `/api/digest/config` |
| `GET` | `/api/docs` |
| `GET` | `/api/health` |
| `GET` | `/api/notifications` |
| `POST` | `/api/notifications` |
| `PATCH` | `/api/notifications/{id}/read` |
| `POST` | `/api/notifications/read-all` |
| `GET` | `/api/openapi.json` |
| `GET` | `/api/settings` |
| `PATCH` | `/api/settings` |
| `POST` | `/api/slack/events` |
| `GET` | `/api/slack/oauth/callback` |
| `GET` | `/api/slack/oauth/install` |
| `GET` | `/api/standup/prompts` |
| `POST` | `/api/standup/prompts` |
| `PATCH` | `/api/standup/prompts/{id}` |
| `GET` | `/api/team` |
| `POST` | `/api/team` |
| `GET` | `/api/team/{teamId}/invitations` |
| `POST` | `/api/team/{teamId}/invitations` |
| `GET` | `/api/team/{teamId}/members` |
| `PATCH` | `/api/team/{teamId}/members/{memberId}` |
| `DELETE` | `/api/team/{teamId}/members/{memberId}` |
| `POST` | `/api/webhooks/stripe` |

## Examples

### GET /api/cron/digest

```bash
curl \
  'https://standard-polls.vercel.app/api/cron/digest'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/cron/digest

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/cron/digest' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/cron/standup

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/cron/standup' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/cron/standup-digest

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/cron/standup-digest' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/dev/mock-install

```bash
curl \
  'https://standard-polls.vercel.app/api/dev/mock-install'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/dev/poll

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/dev/poll' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/digest/config

```bash
curl \
  'https://standard-polls.vercel.app/api/digest/config'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/digest/config

```bash
curl \
  -X PATCH \
  'https://standard-polls.vercel.app/api/digest/config' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/docs

```bash
curl \
  'https://standard-polls.vercel.app/api/docs'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/health

```bash
curl \
  'https://standard-polls.vercel.app/api/health'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/notifications

```bash
curl \
  'https://standard-polls.vercel.app/api/notifications'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/notifications

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/notifications' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/notifications/{id}/read

```bash
curl \
  -X PATCH \
  'https://standard-polls.vercel.app/api/notifications/<id>/read' \
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
  'https://standard-polls.vercel.app/api/notifications/read-all' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/openapi.json

```bash
curl \
  'https://standard-polls.vercel.app/api/openapi.json'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/settings

```bash
curl \
  'https://standard-polls.vercel.app/api/settings'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/settings

```bash
curl \
  -X PATCH \
  'https://standard-polls.vercel.app/api/settings' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/slack/events

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/slack/events' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/slack/oauth/callback

```bash
curl \
  'https://standard-polls.vercel.app/api/slack/oauth/callback'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/slack/oauth/install

```bash
curl \
  'https://standard-polls.vercel.app/api/slack/oauth/install'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/standup/prompts

```bash
curl \
  'https://standard-polls.vercel.app/api/standup/prompts'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/standup/prompts

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/standup/prompts' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/standup/prompts/{id}

```bash
curl \
  -X PATCH \
  'https://standard-polls.vercel.app/api/standup/prompts/<id>' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `id` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team

```bash
curl \
  'https://standard-polls.vercel.app/api/team'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/team' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/invitations

```bash
curl \
  'https://standard-polls.vercel.app/api/team/<teamId>/invitations'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/team/{teamId}/invitations

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/team/<teamId>/invitations' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### GET /api/team/{teamId}/members

```bash
curl \
  'https://standard-polls.vercel.app/api/team/<teamId>/members'
```

**Path parameters:**
- `teamId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### PATCH /api/team/{teamId}/members/{memberId}

```bash
curl \
  -X PATCH \
  'https://standard-polls.vercel.app/api/team/<teamId>/members/<memberId>' \
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
  'https://standard-polls.vercel.app/api/team/<teamId>/members/<memberId>'
```

**Path parameters:**
- `teamId` (string, required)
- `memberId` (string, required)

Returns JSON. Throws `ApiError` on non-2xx responses.

### POST /api/webhooks/stripe

```bash
curl \
  -X POST \
  'https://standard-polls.vercel.app/api/webhooks/stripe' \
  -H "content-type: application/json" \
  -d '{"example":"value"}'
```

Returns JSON. Throws `ApiError` on non-2xx responses.

---

_Generated by `scripts/gen-api-md.ts` on 2026-06-28. Do not edit by hand._
