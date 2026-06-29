# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Firefly is a feature-rich static blog theme built on **Astro 6** with **Svelte 5** for interactive components. It's a fork of [Fuwari](https://github.com/saicaca/fuwari) extended with extensive features. Primary language is Chinese (Simplified) with i18n for en, zh_TW, ja, ru.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build (icons → LQIPs → Astro build → Pagefind indexing) |
| `pnpm preview` | Preview production build |
| `pnpm check` | `astro check` for type/error checking |
| `pnpm type-check` | `tsc --noEmit --isolatedDeclarations` |
| `pnpm lint` | Biome lint + auto-fix |
| `pnpm format` | Biome format |
| `pnpm new-post <filename>` | Scaffold a new blog post |

Package manager is **pnpm** (enforced). Node.js >= 22 required.

## Architecture

### Astro + Svelte Hybrid

- `.astro` components for static content and layouts
- `.svelte` components for interactive UI (search, settings, pagination, archive) — mounted with `client:load` or `client:visible`
- Swup.js handles SPA-like page transitions with multiple container targets

### Configuration-Driven

All features are toggled/configured via TypeScript files in `src/config/`, exported through the barrel at `src/config/index.ts`. Key configs:

- `siteConfig.ts` — core site settings, theme, pagination
- `sidebarConfig.ts` — sidebar layout (left/right/both, widget ordering)
- `commentConfig.ts`, `analyticsConfig.ts`, `fontConfig.ts`, etc.

### Layout System

- `Layout.astro` — base HTML shell (head, body, theme init, analytics, Swup hooks)
- `MainGridLayout.astro` — full page grid with sidebar(s), navbar, wallpaper, footer

### Content Collections

Defined in `src/content.config.ts`:
- `posts` — blog posts (`.md`/`.mdx`) with frontmatter: title, published, tags, category, draft, pinned, password, comment, etc.
- `spec` — special pages (about, guestbook)

### Key Directories

- `src/components/` — organized by domain: `analytics/`, `comment/`, `common/`, `controls/`, `features/`, `layout/`, `misc/`, `pages/`, `widget/`
- `src/plugins/` — 15 custom remark/rehype plugins (Mermaid, PlantUML, KaTeX, GitHub cards, reading time, etc.)
- `src/i18n/` — translation keys in `i18nKey.ts`, language files in `languages/*.ts`, lookup via `translation.ts`
- `src/utils/` — content sorting, crypto (encrypted posts), date formatting, image processing/LQIP, TOC generation
- `src/pages/` — Astro file-based routing
- `scripts/` — build-time utilities (`generate-icons.js`, `generate-lqips.ts`, `new-post.js`)

### Path Aliases (tsconfig.json)

`@components/*`, `@assets/*`, `@constants/*`, `@utils/*`, `@i18n/*`, `@layouts/*` → `./src/<dir>/*`; `@/*` → `./src/*`

## Code Style

- **Biome** enforces: tab indentation, double quotes, recommended lint rules
- Relaxed rules for `.svelte`/`.astro` files (useConst off, noUnusedVariables off)
- Commit convention: `add:`, `fix:`, `change:`, `chore:` prefixes

## Build Pipeline

Multi-step: `scripts/generate-icons.js` → `scripts/generate-lqips.ts` → `astro build` → `pagefind --site dist`

Icons/LQIP data are generated into `src/constants/` and committed. Regenerate with `pnpm icons` or `pnpm lqips`.

## Deployment

- **Vercel** (default, `vercel.json`)
- **Cloudflare Workers** (`wrangler.jsonc`, set `CF_WORKERS` env var)

### Cloudflare Workers — Critical Deployment Notes

The `@astrojs/cloudflare` adapter generates `dist/client/wrangler.json` at build time, which **overrides** the `main` and `assets` fields in `wrangler.jsonc`. The user's `wrangler.jsonc` only contributes **bindings** (kv_namespaces, secrets, observability) to the final deployment config.

**Do NOT add a standalone `worker.ts` at the project root** — it will never be used. All server-side logic must be implemented as Astro API routes in `src/pages/api/`.

### Server-Rendered API Routes

Routes that handle POST requests or read Cloudflare bindings at runtime must opt out of pre-rendering:

```typescript
// src/pages/api/my-endpoint.ts
export const prerender = false;
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env; // Cloudflare KV, secrets, etc.
  // ...
};
```

Cloudflare bindings are accessed via `locals.runtime.env`. The types for this are defined in `src/env.d.ts` under `declare global { namespace App { interface Locals { runtime: { env: CloudflareEnv } } } }`. The `declare global` wrapper is required because `env.d.ts` contains `export {}`, making it a module file.

### Adding Sidebar Widgets

Four files must change in sync:

1. **Create** `src/components/widget/MyWidget.astro` — use `WidgetLayout` as wrapper, accept `widgetConfig?: WidgetComponentConfig` prop
2. **Add type** — append `| "myWidget"` to `WidgetComponentType` in `src/types/sidebarConfig.ts`
3. **Register** — import the component and add `myWidget: MyWidget` to `componentMap` in `src/components/layout/SideBar.astro`
4. **Enable** — add an entry with `type: "myWidget"` to `leftComponents`, `rightComponents`, or `mobileBottomComponents` in `src/config/sidebarConfig.ts`

Use existing widget CSS classes (`card-base`, `btn-regular`, `btn-plain`, `text-neutral-600 dark:text-neutral-300`, `bg-neutral-100/60 dark:bg-neutral-800/50`) — do not introduce new CSS.

## Email Subscription System

Lives in `src/pages/api/`: `subscribe.ts`, `unsubscribe.ts`, `notify.ts` (all with `prerender = false`).

- **Storage**: Cloudflare KV namespace `SUBSCRIBERS` (binding ID in `wrangler.jsonc`)
- **Email delivery**: Resend API (`RESEND_API_KEY` Worker secret), sender `noreply@cf-blog.liujiahang.icu`
- **Notification trigger**: GitHub Actions calls `POST /api/notify` (authenticated with `NOTIFY_SECRET`) only when `src/content/posts/` changes
- **Post list source**: `/api/allPostMeta.json` (pre-rendered static endpoint from `src/pages/api/allPostMeta.json.ts`)
