---
name: fg-runtime-qa
description: Use for FG post-change runtime verification after an approved patch when observable evidence is required. Collects existing runtime QA anchors into a repeatable procedure without adding policy or bypassing permission gates.
---

# fg-runtime-qa

## Purpose

This skill turns existing FG runtime QA rules into a repeatable evidence workflow after an approved change.

It is for actual post-change runtime verification:
- confirm observable behavior
- collect runtime, browser, console, and API evidence
- report PASS / FAIL / PARTIAL / NOT RUN honestly

It is not a new policy layer.
It only operationalizes existing QA anchors already defined in FG authority files and relevant package scripts.

## Authority Boundary

Authority stays in:
- `AGENTS.md`
- `CODEX_RULES.md`
- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `docs/project/policy/agent_authority_and_sources.md`
- `docs/project/policy/agent_execution_contract.md`
- `docs/project/policy/agent_tool_routing.md`
- `docs/project/policy/agent_chart_workflow.md`

This skill is procedure-only.
If this skill conflicts with authority docs, authority docs win.

This skill must not:
- create new policy
- weaken existing execution gates
- replace current-state or policy-chain routing
- reinterpret reasoning-only conclusions as runtime evidence

## When to Use

Use this skill after approved patches that affect:
- frontend UI/components
- search/suggestions
- Results compact
- expanded chart
- chart indicators/timeframes
- backend routes/API
- news/dividends/data surfaces
- runtime behavior

Do not use this skill for:
- planning tests before a patch
- exploratory architecture work
- executing a patch
- dependency updates
- migrations
- DB modification

## Inputs Expected

Expected inputs:
- changed files
- user-approved QA scope
- affected layer
- expected behavior
- available runtime command permission
- known risks from patch summary

If these inputs are incomplete, ask only for the missing runtime QA boundary needed to proceed safely.

## Allowed Actions

Allowed only with explicit QA/runtime permission:
- inspect changed files
- inspect relevant package scripts
- run approved build/test/dev commands
- collect browser/runtime/API evidence
- summarize PASS/FAIL

Keep the scope tied to the approved patch and approved runtime surface only.

## Forbidden Actions

Forbidden actions:
- editing code
- editing policy docs
- installing packages
- updating dependencies
- running migrations
- modifying DB
- deleting files
- changing `.env`
- using secrets
- expanding QA scope without approval
- treating reasoning only as runtime evidence

## QA Modes by Layer

Frontend command anchors:
- `[3000] npm start` - normal dev baseline
- `[3100] npm run start:test:rest` - REST aggregation enabled parity
- `[3101] npm run start:test:app` - app aggregation disabled parity
- `npm run build` - production build check
- `npm run e2e` - only with explicit browser/e2e permission
- `npm run e2e:ui` - only with explicit interactive QA permission
- `npm run e2e:install` - forbidden unless explicit install permission is given

Backend command anchors:
- `backend1 npm start` - only with explicit runtime QA permission
- `backend2 npm start` - only with explicit runtime QA permission
- `backend2 npm test` - mark as unknown/not reliable unless authority docs say otherwise

## Browser Plugin Route

- For Codex app browser QA, prefer the selected UI plugin: `Браузер — Control the in-app browser with Codex`
- Expected route: `browser:control-in-app-browser`
- Do not require `browser_use` / `browse_use` unless that exact route is explicitly surfaced
- `mcp__node_repl__js` is allowed only as the internal substrate of `browser:control-in-app-browser`
- Do not use `mcp__node_repl__js` as an independent browser fallback route
- Playwright MCP requires separate explicit approval
- Chrome DevTools MCP requires separate explicit approval
- If Browser plugin route is not available, report `NOT RUN` instead of silently switching tools

## Working Directories

- Frontend commands run from `fingineerwebapp/`.
- Backend1 commands run from `backend1/`.
- Backend2 commands run from `backend2/`.

Notes:
- Start with the environment where the bug or change was just observed.
- If that is not explicitly known, start with `[3000]`.
- Use `[3100]` and `[3101]` for parity/smoke comparison only when the approved QA scope requires them.
- Do not report a bug as global unless it reproduces in more than one environment.

## Layer-Specific Checklists

### UI / Component

Check:
- component renders
- no obvious layout collapse
- loading/empty/error states if affected
- console has no new runtime errors
- visual behavior matches expected change

### Search / Suggestions

Check:
- input opens suggestions
- fully clear the search input before each query and verify it is empty before typing
- do not treat dirty input state as a product failure
- smoke test at least `gazp`, `GAZP`, `Газпром`, and `газ`
- expected smoke result: suggestions include `GAZP ГАЗПРОМ ао` where applicable
- if the first attempt fails, repeat once with confirmed clean input before marking FAIL
- if dirty input is detected, report QA setup issue, not product failure
- loading state
- no-results state
- error state if relevant
- selecting suggestion still updates selected instrument

### Results Compact

Check:
- `CompanyInfo` renders
- `Price` renders
- `KeyMetrics` renders
- chart evidence remains visible
- News/Dividends surfaces do not disappear unexpectedly

### Expanded Chart

Check:
- expanded transition works
- controls appear only where expected
- chart does not collapse
- timeframe/interval behavior remains stable
- no new console errors

### Chart Indicator / Timeframe

Check:
- affected indicator renders
- pane/series behavior remains stable
- compact/expanded parity risk is stated
- no fake data or hidden fallback is introduced

### Backend Route / API

Check:
- route starts/responds only if approved runtime scope allows it
- response shape matches frontend consumer expectation
- error response is understood
- no DB mutation
- no secret output

### News / Dividends / Data

Check:
- no fake data introduced
- fallback behavior is explicit
- data source authority is not changed
- stale/cache risk is stated if relevant

## Evidence Format

Use this exact output schema in Russian:

### Runtime QA Result

- Scope:
- Changed files:
- QA permission:
- Commands run:
  - command:
  - environment label:
  - result: PASS / FAIL / NOT RUN
  - evidence:
- Observable behavior:
- Console/runtime errors:
- API/backend evidence:
- Remaining risk:
- Final status: PASS / FAIL / PARTIAL / NOT RUN

If multiple commands are run, repeat the command block once per command.

## Stop Conditions

Stop and report instead of continuing if:
- command requires install
- command enters unexpected watch mode
- dev server port is occupied and no permission to change port exists
- `.env` or secret is required
- DB/migration is required
- QA scope requires external services not approved
- runtime evidence cannot be collected safely
- requested QA would exceed approved scope

## Relationship to Existing Skills

`qa-test-planner` creates plans.
`fg-runtime-qa` collects actual post-change evidence.
`fg-runtime-qa` must not replace owner/authority tracing skills.
`fg-runtime-qa` must not become an execute skill.

If owner, authority, identity, or phase is unclear before runtime verification, use the appropriate tracing workflow first instead of stretching this skill into architecture analysis.

## Output Discipline

Required discipline:
- no patching during QA
- no broad unrelated QA
- no "looks good" without evidence
- report NOT RUN honestly when runtime was not executed
- list remaining risk explicitly
