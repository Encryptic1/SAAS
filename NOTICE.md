# NOTICE

This NOTICE file provides attribution for third-party software included in the
Market Standard SAAS portfolio.

## Market Standard portfolio

Copyright (c) 2026 Market Standard. Licensed under the MIT License (see
[`LICENSE`](./LICENSE)). Each package under `packages/*` and each app under
`apps/*` includes its own copy of the MIT LICENSE.

## Third-party software

This product depends on the following open-source packages. A complete
machine-readable inventory can be generated with:

```bash
pnpm exec license-checker --production --csv > notice-inventory.csv
```

### Runtime dependencies (permissive licenses)

- **next** — MIT License — https://nextjs.org
- **react / react-dom** — MIT License — https://react.dev
- **drizzle-orm** — Apache-2.0 License — https://orm.drizzle.team
- **@supabase/supabase-js** — MIT License — https://supabase.com
- **stripe** — MIT License — https://stripe.com/docs/api
- **hono** — MIT License — https://hono.dev
- **@electric-sql/pglite** — Apache-2.0 License — https://pglite.dev
- **postgres** — MIT License — https://github.com/porsager/postgres
- **playwright** — Apache-2.0 License — https://playwright.dev
- **pagefind** — MIT License — https://pagefind.app
- **swagger-ui-dist** — Apache-2.0 License — https://swagger.io/tools/swagger-ui

### Development dependencies

- **typescript** — Apache-2.0 License — https://www.typescriptlang.org
- **turbo** — MIT License — https://turbo.build
- **tsx** — MIT License — https://github.com/privatenumber/tsx
- **knip** — ISC License — https://knip.dev
- **license-checker** — BSD-2-Clause License — https://github.com/davglass/license-checker
- **@lhci/cli** — Apache-2.0 License — https://github.com/GoogleChrome/lighthouse-ci

All third-party licenses are permissive (MIT, Apache-2.0, ISC, BSD). No
copyleft (GPL/AGPL/SSPL) or unlicensed code is included in production builds.
The `license-check` GitHub Actions workflow enforces this on every pull
request.

## License inventory

A fresh inventory is generated on every CI run and uploaded as the
`license-inventory` artifact. To regenerate locally:

```bash
pnpm licenses list              # table view
pnpm licenses list --json       # machine-readable
```

The `license-check` GitHub Actions workflow runs `pnpm licenses list --json`
on every pull request and fails if any forbidden license (GPL, AGPL, SSPL,
Unlicensed, CC-BY-NC) is detected.
