# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Build | `npm run build` (tsup + shebang check) |
| Dev (watch) | `npm run dev` |
| Run all tests | `npm test` |
| Run tests in watch mode | `npm run test:watch` |
| Run a single test file | `npx vitest run src/tools/control/index.test.ts` |
| Type check / Lint | `npm run typecheck` (`tsc --noEmit`) |
| Publish | Tag + push: `git tag v1.0.0 && git push --tags` (triggers GitHub Actions → npm) |

**Test notes**: Integration tests are excluded from default `npm test` via `vitest.config.ts`. Vitest globals are enabled — `describe`/`it`/`expect` need no import.

## Architecture

MCP Server for WeChat DevTools automation. Two API backends exposed as tool groups:

```
src/index.ts          → Entry: reads env vars, inits control API, starts MCP server
src/server.ts         → MCP Server: registers all tools, dispatches CallTool requests
src/logger.ts         → Stderr logger (DEBUG/INFO/ERROR, controlled by LOG_LEVEL)
src/api/control.ts    → HTTP client for DevTools Control API (module-scoped singleton)
src/tools/control/    → wechat_control_* tools (11 tools, HTTP-based)
src/tools/auto/       → wechat_auto_* tools (2 tools, stub for miniprogram-automator)
```

**Tool registration flow**: Each tool group exports an array of `{name, description, inputSchema, handler}`. [server.ts](src/server.ts) merges them into `allTools` for `ListTools` and dispatches `CallTool` by name lookup.

**Control API** (`src/api/control.ts`): Stateless HTTP client hitting `http://127.0.0.1:{port}/v2/*`. Initialized once via `initControlApi()`, holds port/timeout/projectPath as module-scoped config. Responses are discriminated union: `text | json | binary` — QR code endpoints default to `base64` format and are converted to MCP image content.

**Project path resolution**: Tools needing a project path call `resolveProject(args)` which falls back to `WECHAT_PROJECT_PATH` env var. Tools that require a project call `requireProject(params)` which throws if neither arg nor env var is set.

**Build**: tsup bundles `src/index.ts` → `dist/index.js` as ESM only. A shebang (`#!/usr/bin/env node`) is injected via tsup banner. Post-build `scripts/check-shebang.js` validates exactly one shebang line exists.

**Publish**: Pushing a `v*` tag triggers `.github/workflows/publish.yml` which runs `npm ci && npm run build && npm test && npm publish`.

## Required environment variables

| Variable | Required | Purpose |
|----------|----------|----------|
| `WECHAT_DEVTOOLS_PORT` | Yes | DevTools HTTP service port |
| `WECHAT_DEVTOOLS_CLI_PATH` | No | CLI path for automation API |
| `WECHAT_PROJECT_PATH` | No | Default project path for tools |
| `LOG_LEVEL` | No | DEBUG/INFO/ERROR, default INFO |

## Agent skills

### Issue tracker

Issues live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles mapped to `待分类`, `需补充信息`, `代理就绪`, `需人工处理`, `不予处理`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. See `docs/agents/domain.md`.
