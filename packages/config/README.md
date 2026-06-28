# @market-standard/config

Shared **TypeScript**, **Tailwind**, and **Biome** configuration for the Market Standard monorepo. No runtime code — consumed via `extends` and `presets`.

## Purpose

- One place for compiler strictness, path aliases, and JSX settings
- Shared Tailwind theme (brand sky-blue palette + Geist font vars)
- Consistent lint/format rules via Biome

## Architecture

```mermaid
flowchart LR
  Config["@market-standard/config"]
  Apps[apps/*]
  Pkgs[packages/*]

  Config -->|typescript/base.json| Pkgs
  Config -->|typescript/nextjs.json| Apps
  Config -->|typescript/react-library.json| UI
  Config -->|tailwind/preset.ts| Apps
  Config -->|biome.json| Root lint
```

## Contents

```
packages/config/
├── typescript/
│   ├── base.json           Strict ES2022, NodeNext modules
│   ├── nextjs.json         Extends base + Next.js plugin
│   └── react-library.json  Extends base for packages/ui
├── tailwind/
│   └── preset.ts           brand color scale, font families
└── biome.json              Formatter + linter rules
```

## Usage

### TypeScript (Next.js app)

```json
{
  "extends": "@market-standard/config/typescript/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Apps use relative extends in practice:

```json
"extends": "../../packages/config/typescript/nextjs.json"
```

### Tailwind

```typescript
import preset from "@market-standard/config/tailwind";
// or relative: ../../packages/config/tailwind/preset.ts

export default {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [preset],
};
```

### Brand colors (Tailwind)

| Token | Default | Use |
|-------|---------|-----|
| `brand-500` | `#0ea5e9` | Dashboard CTAs (light UI) |
| `brand-600` | `#0284c7` | Primary buttons |

Marketing pages use FloodG8-inspired CSS vars from `@market-standard/ui/marketing.css` instead.

## Development

No build step. Changes here affect all consumers on next `pnpm dev` / `pnpm build`.

## Testing

Verify configs resolve:

```bash
pnpm typecheck
pnpm build
```

## Related docs

- Root [README.md](../../README.md)
- UI marketing theme: [packages/ui/README.md](../ui/README.md)
