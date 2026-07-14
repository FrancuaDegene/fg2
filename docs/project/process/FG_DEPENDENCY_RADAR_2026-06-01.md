# FG Dependency Radar - 2026-06-01

## Scope

Checked audit-only:

- frontend npm dependencies: `fingineerwebapp`
- backend Node dependencies: `backend1`, `backend2`
- Python / Django / Celery roots
- Docker/runtime base images
- chart-critical dependencies
- security-sensitive dependencies

No dependency update, install, audit fix, source change, Dockerfile change, package manifest change, or lockfile change was performed.

## Anchor

- mode: `ANCHOR -> AUDIT`
- branch: `fix/toolbar-range-contrast`
- initial git status: dirty before audit; many existing modified/untracked files were present
- dependency roots:
  - `fingineerwebapp/package.json`
  - `fingineerwebapp/package-lock.json`
  - `backend1/package.json`
  - `backend1/package-lock.json`
  - `backend2/package.json`
  - `backend2/package-lock.json`
  - `backend1/Dockerfile`
  - `backend2/Dockerfile`
- Python requirement roots found: none
- root `.npmrc` signals:
  - `fingineerwebapp/.npmrc`: `ignore-scripts=true`
  - `backend1/.npmrc`: `ignore-scripts=true`
  - `backend2/.npmrc`: `ignore-scripts=true`

## Commands / Signals

Commands run:

```bash
git branch --show-current
git status --short
rg --files -g "package.json" -g "package-lock.json" -g "npm-shrinkwrap.json" -g "yarn.lock" -g "pnpm-lock.yaml" -g "requirements*.txt" -g "pyproject.toml" -g "Pipfile" -g "poetry.lock" -g "Dockerfile*" -g "docker-compose*.yml" -g "docker-compose*.yaml"
Get-Content -Path AGENTS.md
Get-Content -Path CODEX_RULES.md
Get-Content -Path docs/project/state/FG_ACTIVE_SOURCE_PACK.md
Get-Content -Path docs/project/process/FG_DEPENDENCY_RADAR_POLICY.md
Get-Content -Path fingineerwebapp/package.json
Get-Content -Path backend1/package.json
Get-Content -Path backend2/package.json
Get-Content -Path backend1/Dockerfile
Get-Content -Path backend2/Dockerfile
cmd /c npm outdated --json
cmd /c npm audit --json
rg -n "Django|Celery|celery|django|requirements|pyproject|pip|uv" -g "*.py" -g "*.txt" -g "*.toml" -g "*.md" -g "*.yml" -g "*.yaml"
```

Execution notes:

- Direct PowerShell `npm` failed due local `ExecutionPolicy` blocking `npm.ps1`.
- Retried with `cmd /c npm ...`; first sandboxed registry access failed with `EACCES`.
- Retried read-only npm registry commands with escalation. No mutating npm command was run.

## Findings

### Frontend

- `npm audit`: `53` total vulnerabilities: `10 low`, `17 moderate`, `26 high`, `0 critical`.
- Direct vulnerable packages:
  - `axios`: current `1.12.2`, wanted/latest `1.16.1`, audit severity `high`, security-sensitive.
  - `react-scripts`: current `5.0.1`, audit severity `high`, fix path reported by npm as semver-major/invalid `0.0.0`; treat as build-stack modernization, not auto-fix.
  - `styled-components`: current `6.1.19`, wanted/latest `6.4.2`, audit severity `moderate`.
- Outdated notable packages:
  - `react`: `19.2.0 -> 19.2.6`
  - `react-dom`: `19.2.0 -> 19.2.6`
  - `axios`: `1.12.2 -> 1.16.1`
  - `socket.io-client`: `4.8.1 -> 4.8.3`
  - `@playwright/test`: `1.57.0 -> 1.60.0`
  - `@skeletonlabs/skeleton-react`: `1.4.0 -> 1.4.2`, latest `4.15.2`
  - `lucide-react`: `0.525.0`, latest `1.17.0`
  - `recharts`: `2.15.4`, latest `3.8.1`
  - `typescript`: `4.9.5`, latest `6.0.3`
  - `web-vitals`: `4.2.4`, latest `5.3.0`
- `vite` is not a dependency in `fingineerwebapp/package.json`; app currently uses `react-scripts`.
- `lightweight-charts` is pinned at `5.2.0`; not reported by `npm outdated`.

Decision:

- `axios`: `patch soon`, security-sensitive separate slice.
- `react-scripts` build stack: `major spike`, not monthly patch.
- `react` / `react-dom`: `chart-critical separate slice`, patch candidate with runtime chart QA.
- `lightweight-charts`: `no action` for this radar.

### Backend Node

#### backend1

- `npm audit`: `11` total vulnerabilities: `6 moderate`, `4 high`, `1 critical`.
- Direct vulnerable packages:
  - `axios`: current `1.10.0`, wanted/latest `1.16.1`, audit severity `high`.
  - `express`: current `4.21.2`, wanted `4.22.2`, latest `5.2.1`, audit severity `high`.
- Critical transitive signal:
  - `form-data`: audit severity `critical`, reachable through installed dependency graph; likely tied to HTTP/form handling stack.
- Outdated notable packages:
  - `openai`: `6.2.0 -> 6.39.1`
  - `socket.io`: `4.8.1 -> 4.8.3`
  - `dotenv`: `16.5.0 -> 16.6.1`, latest `17.4.2`
  - `helmet`: `7.2.0`, latest `8.2.0`
  - `express-rate-limit`: `7.5.1`, latest `8.5.2`
  - `redis`: `4.7.1`, latest `6.0.0`

Decision:

- `axios` / transitive `form-data`: `security emergency` candidate, separate backend1 slice.
- `express 4.x patch`: `patch soon`, server-runtime separate slice.
- `openai`: `watch`, security-sensitive SDK minor train has moved significantly; separate review before update.
- `redis 6`: `major spike`.

#### backend2

- `npm audit`: `12` total vulnerabilities: `4 low`, `1 moderate`, `7 high`, `0 critical`.
- Direct vulnerable packages:
  - `express`: current `4.18.2`, wanted `4.22.2`, latest `5.2.1`, audit severity `high`.
  - `socket.io`: current `4.7.5`, wanted/latest `4.8.3`, audit severity `low` direct, with high transitive `engine.io` / `ws` / `socket.io-parser` signals.
- Outdated notable packages:
  - `mysql2`: `3.12.0 -> 3.22.4`
  - `ioredis`: `5.4.2 -> 5.11.0`
  - `socket.io`: `4.7.5 -> 4.8.3`
  - `bootstrap`: `5.3.2 -> 5.3.8`
  - `dotenv`: `16.4.5 -> 16.6.1`, latest `17.4.2`
  - `helmet`: `7.2.0`, latest `8.2.0`
  - `express-rate-limit`: `7.5.1`, latest `8.5.2`

Decision:

- `express 4.x patch`: `patch soon`, server-runtime separate slice.
- `socket.io 4.8.3`: `patch soon`, socket runtime separate slice.
- `mysql2` / `ioredis`: `minor update`, backend2 data-layer slice after security slices.

### Python / Django / Celery

- No `requirements*.txt`, `pyproject.toml`, `Pipfile`, or `poetry.lock` roots were found by dependency-root scan.
- Repo text scan found no active Django/Celery/Python dependency roots.

Decision:

- `no action` for this radar.

### Docker / Runtime Images

- `backend1/Dockerfile` and `backend2/Dockerfile` both contain:
  - `FROM ubuntu:latest`
  - later `FROM node:18`
  - `RUN npm install`
- `ubuntu:latest` is a floating tag and should not be treated as reproducible runtime pinning.
- `node:18` is an old runtime line; treat as infrastructure modernization risk.
- Dockerfiles were already modified before this audit according to initial `git status`.

Decision:

- Docker Node runtime: `major update spike`, separate infra slice.
- Docker install command: `watch`; future Docker slice should consider lockfile-respecting install behavior, but no Dockerfile change in this audit.

### Chart-Critical Dependencies

- `lightweight-charts`: package declares `5.2.0`; not reported outdated.
- `react`: `19.2.0 -> 19.2.6`.
- `react-dom`: `19.2.0 -> 19.2.6`.
- `vite`: not present; current frontend build stack is `react-scripts`.

Decision:

- `lightweight-charts`: `no action`.
- `react` / `react-dom`: `chart-critical separate slice`, with Compact/Expanded chart runtime QA.
- `react-scripts` replacement or migration: `major spike`, not a dependency patch.

### Security-Sensitive Dependencies

- HTTP clients:
  - frontend `axios`: high direct audit signal.
  - backend1 `axios`: high direct audit signal and critical transitive `form-data` signal.
  - backend2 has no direct `axios`.
- Web/server:
  - backend1 `express`: high direct audit signal.
  - backend2 `express`: high direct audit signal.
  - backend1/backend2 `socket.io`: patch available; backend2 has high transitive socket stack signals.
- OpenAI SDK:
  - backend1 `openai`: `6.2.0 -> 6.39.1`; no direct audit vulnerability reported, but security-sensitive SDK drift is material.
- Telegram SDK:
  - no Telegram SDK/package found in npm dependency roots.
- Parsers/webhooks:
  - `qs`, `body-parser`, `path-to-regexp`, `form-data`, `cookie`, `ws` appear in audit as transitive security-sensitive parser/server components.

## Risk Classification

### Urgent security

- `backend1` `axios` / transitive `form-data`: `critical` audit signal plus server-side HTTP client exposure. Decision: separate backend1 security patch slice.

### Major update spike

- frontend build stack: `react-scripts` audit fix is not a normal patch path; migration/replacement requires separate spike.
- frontend major packages: `@skeletonlabs/skeleton-react 1.x -> 4.x`, `lucide-react 0.x -> 1.x`, `recharts 2.x -> 3.x`, `typescript 4.x -> 6.x`, `web-vitals 4.x -> 5.x`.
- backend1 `redis 4.x -> 6.x`.
- Docker runtime: `node:18` modernization.

### Minor/patch update candidate

- frontend `axios 1.12.2 -> 1.16.1`.
- frontend `socket.io-client 4.8.1 -> 4.8.3`.
- frontend `styled-components 6.1.19 -> 6.4.2`.
- backend1 `express 4.21.2 -> 4.22.2`.
- backend1 `socket.io 4.8.1 -> 4.8.3`.
- backend2 `express 4.18.2 -> 4.22.2`.
- backend2 `socket.io 4.7.5 -> 4.8.3`.
- backend2 `mysql2 3.12.0 -> 3.22.4`.
- backend2 `ioredis 5.4.2 -> 5.11.0`.

### Chart-critical separate slice

- `react` / `react-dom 19.2.0 -> 19.2.6`.
- Any future `lightweight-charts` update, if it appears, must remain isolated with chart runtime QA.

### No action

- Python / Django / Celery: no dependency roots found.
- `lightweight-charts`: no outdated signal in this radar.
- Telegram SDK: no package found in dependency roots.

## Service Risk Board

| Service / layer | Stage | Evidence | Decision | Next safe slice | Blocked actions |
| --- | --- | --- | --- | --- | --- |
| `backend1` HTTP client stack | critical | Direct `axios 1.10.0`; transitive `form-data 4.0.3`; `npm audit` reports `form-data` critical range `>=4.0.0 <4.0.4`; server runtime dependency; exploitability unknown. | security emergency candidate | Separate `backend1` HTTP security slice for `axios` and required transitive HTTP/form stack. | Do not mix with frontend sprint work; do not mix with `express`, `redis`, `openai`, Docker, or feature changes; do not run `npm audit fix`, `npm audit fix --force`, `npm update`, or `npm install`. |
| `backend2` runtime | high | Direct `express` high audit signal; `socket.io` stack has high transitive server/socket signals. | patch later / separate backend runtime slices | Separate backend runtime slices after `backend1` HTTP security decision; keep `express` and `socket.io` isolated. | Do not combine with `backend1` emergency slice; do not combine server runtime with DB/client library updates. |
| `frontend` transport/build | high | Direct `axios` high audit signal; `react-scripts` high build-stack debt. | patch later / major spike for build stack | Frontend `axios` slice later if selected; separate `react-scripts` modernization spike. | Do not interrupt frontend sprint with backend dependency patching; do not mix `axios` with build-stack migration. |
| Docker/runtime | watch | `backend1/Dockerfile` and `backend2/Dockerfile` use `ubuntu:latest`, `node:18`, and `RUN npm install`; infrastructure risk, not immediate exploit proof in this radar. | major spike | Docker/runtime modernization spike only after explicit infra decision. | Do not touch Dockerfiles in this docs-only normalization; do not silently bump base images. |
| Chart-critical dependencies | watch | `react` / `react-dom 19.2.0 -> 19.2.6`; `lightweight-charts 5.2.0` had no outdated signal; `vite` absent. | watch / separate chart-critical slice | React chart-critical patch slice only with Compact/Expanded runtime QA across `[3000]`, `[3100]`, `[3101]`. | Do not update chart-critical dependencies without runtime visual QA; do not force parity work into dependency slices. |
| OpenAI SDK | watch | `backend1 openai 6.2.0 -> 6.39.1`; no direct audit vulnerability reported, but security-sensitive SDK drift is material. | watch | OpenAI SDK review slice after urgent backend security work. | Do not bundle OpenAI SDK update into `backend1` HTTP security slice. |
| Python / Django / Celery roots | no action | No `requirements*.txt`, `pyproject.toml`, `Pipfile`, or `poetry.lock` roots found. | ignore | None. | Do not create Python dependency work without repo roots/evidence. |

## Sprint Boundary Decision

Decision:

Do not interrupt the upcoming frontend sprint with backend dependency patches unless production exposure or reachable exploit evidence is confirmed.

Rules:

- `backend1` HTTP security remains the first backend dependency slice.
- Do not mix backend security with frontend sprint work.
- Do not run `npm audit fix`, `npm audit fix --force`, `npm update`, or `npm install`.
- Do not touch `package.json` or `package-lock.json`.
- Do not touch Dockerfiles.
- This is docs-only normalization.

## Suggested Update Slices

1. `backend1` HTTP security slice
   - package/group: `axios` and required transitive HTTP/form stack
   - reason: critical/high audit signal
   - expected files: `backend1/package.json`, `backend1/package-lock.json`
   - runtime QA: backend1 API smoke, outbound HTTP flow, error handling
   - rollback: revert backend1 manifest/lockfile only

2. Backend Express 4.x patch slice
   - package/group: `express` and transitive server parser stack, one backend at a time
   - reason: high audit signal
   - expected files: one backend package manifest/lockfile at a time
   - runtime QA: API routes, CORS, rate limit, error responses
   - rollback: revert touched backend manifest/lockfile

3. Socket.IO patch slice
   - package/group: `socket.io` / `socket.io-client`, one client/server boundary at a time
   - reason: socket runtime security patch and protocol behavior risk
   - expected files: selected package manifest/lockfile only
   - runtime QA: socket connect/disconnect, data push, browser console
   - rollback: revert touched manifest/lockfile

4. Frontend axios slice
   - package/group: `axios`
   - reason: direct high audit signal
   - expected files: `fingineerwebapp/package.json`, `fingineerwebapp/package-lock.json`
   - runtime QA: frontend API calls, network errors, search/results flow
   - rollback: revert frontend manifest/lockfile

5. React chart-critical patch slice
   - package/group: `react`, `react-dom`
   - reason: chart-critical runtime patch candidate
   - expected files: `fingineerwebapp/package.json`, `fingineerwebapp/package-lock.json`
   - runtime QA: `[3000]`, `[3100]`, `[3101]` smoke; Compact/Expanded chart render, indicators, panes, toolbar, console
   - rollback: revert frontend manifest/lockfile

6. Frontend build-stack modernization spike
   - package/group: `react-scripts` / build stack
   - reason: broad high audit surface and no safe normal patch path
   - expected files: spike docs first; no immediate dependency patch
   - runtime QA: build, dev server, e2e, chart visual QA
   - rollback: spike only until explicit execution decision

7. Docker runtime modernization spike
   - package/group: Docker base images and install strategy
   - reason: `ubuntu:latest`, `node:18`, `RUN npm install`
   - expected files: spike docs first; Dockerfile changes only in later EXECUTE slice
   - runtime QA: image build, container start, API smoke
   - rollback: revert Dockerfile changes only

## Deferred

- Major frontend dependency migrations: defer to dedicated spikes because blast radius includes UI/chart/runtime behavior.
- Backend data-layer updates: defer until urgent server security slices are resolved.
- Docker/runtime update: defer to infra spike.
- Python/Django/Celery: defer because no roots exist in repo evidence.

## Notes

- This radar used npm registry audit data on 2026-06-01.
- `npm audit fix`, `npm audit fix --force`, `npm update`, `npm install`, and package edits were not run.
- Current worktree was dirty before the audit; do not attribute pre-existing dirty files to this radar.
