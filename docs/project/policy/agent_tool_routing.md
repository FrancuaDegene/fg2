# Agent Tool Routing

## Purpose

Этот файл — нормативное расширение root contracts для `MCP routing`, tool routing, skill routing, decision order, mixed flow rules и routing anti-patterns в FG.

Он фиксирует:
- как агент выбирает первый route для задачи;
- какой тип truth нужен первым;
- когда нужен `MCP`;
- когда нужен другой tool layer;
- когда нужен skill;
- когда mixed flow действительно оправдан;
- какие routing mistakes недопустимы.

Этот файл не задаёт source priority canon, `REFRESH` completeness, chart workflow canon или execution mechanics.

## Routing Principles

Базовые принципы routing:
- `task class first`
- `truth needed first`
- `repo truth first when required`
- `owner / authority check before patch-oriented synthesis`
- `MCP first, skill second`
- `rule-based first`
- freer classification только для ambiguous / mixed cases
- routing itself does not authorize patch

Patch planning не начинается только потому, что выбран tool или skill.
Сначала должен быть понятен route, evidence path и только затем patch-oriented synthesis.

## Routing Decision Order

Для каждой задачи routing должен идти в таком порядке:

1. `task_class`
2. `truth_needed_first`
3. `repo_truth_required_first`
4. `first_mcp_or_tool_layer`
5. `owner / authority check if patch-oriented synthesis is likely`
6. `primary_skill`
7. `secondary_skill if needed`
8. `mixed_flow only if truly needed`

Смысл:
- сначала понять, что за задача;
- потом понять, какой truth нужен первым;
- потом проверить, не нужно ли сначала поднять authoritative repo layer;
- только потом выбирать `MCP`, tool layer и skills.

## Tool Routing Table

### Web platform, library docs, and FG evidence

Route by the contract being verified:

- Use repository code, lockfiles, accepted current-state, and authoritative FG docs for factual FG state. Follow `agent_authority_and_sources.md` for source precedence.
- Use MDN MCP for HTML, CSS, DOM, browser JavaScript APIs, Web APIs, browser behavior, compatibility, Baseline, accessibility, storage, service workers, page lifecycle, and browser security.
- Use Context7 for React, Vite, lightweight-charts, Express, Socket.IO, Django, Celery, SDKs, and version-specific library or framework documentation.
- In mixed cases, verify the library contract with Context7 and the underlying browser contract with MDN.
- Do not call both MCPs automatically for every frontend task.
- Send only bounded abstract documentation queries. Do not send repository source code, secrets, tokens, private URLs, user data, or market-data payloads to external MCPs.

### External library / API / framework / SDK behavior
- truth needed first: upstream truth
- repo truth first: no
- first route: `Context7`
- use when:
  - важны library behavior, framework behavior, SDK / API behavior, versions, method signatures, upstream best practices
- do not use when:
  - вопрос уже целиком лежит в accepted project context
  - нужен прежде всего live code truth

### Accepted context / current stop-point / frontier / handoff narrowing
- truth needed first: accepted project context
- repo truth first: yes
- first route after authoritative repo truth check: `gbrain MCP`
- use when:
  - нужен current stop-point
  - нужен closed/open frontier
  - нужен accepted contract
  - нужен handoff narrowing
- do not use when:
  - вопрос чисто про symbol-level code truth
  - вопрос можно закрыть только live code anchors

### Live code truth / symbol refs / readers-writers / call-flow / data-flow / mutation points
- truth needed first: live code truth
- repo truth first: yes
- first route: Serena
- use when:
  - нужен file/symbol truth
  - нужны readers / writers
  - нужен call-flow / data-flow / mutation tracing
- do not use when:
  - вопрос прежде всего про accepted context
  - вопрос прежде всего про upstream library truth

### Runtime / UI / browser verification
- truth needed first: runtime evidence
- repo truth first: depends on task
- first route: `Playwright MCP or QA layer`
- use when:
  - runtime/browser evidence действительно нужен
  - без observable effect нельзя честно ответить
- do not use when:
  - достаточно accepted context
  - достаточно live code truth
  - достаточно QA docs / existing evidence
- important:
  - `Playwright MCP` не default route для любого UI/runtime вопроса
  - это verification route, а не универсальный first route

### Helper recall for conventions / commands / completion support
- truth needed first: helper recall
- repo truth first: yes
- helper recall route: `.serena/memories/*`
- use when:
  - нужен helper recall для conventions / commands / completion support
- do not use when:
  - нужен authoritative project truth
  - нужен accepted context truth
  - нужен stable architecture truth
- important:
  - это helper memory layer, а не authoritative truth layer

## Skill Routing Table

### Unclear scope / risky multi-layer ambiguity
- primary skill: `requirements-clarity`
- use when:
  - scope неясен
  - задача многослойная или рискованная
- do not use when:
  - task class уже ясен и ambiguity снята

### Chart-engine / viewport / navigation / ownership / MultiPane / ChartCanvas
- primary skill: `fg-chart-architect`
- use when:
  - задача chart-engine specific
  - затронуты viewport, pan/zoom, visible range, ownership boundaries
- do not use when:
  - задача не chart-specific

### Accepted context + live code synthesis before patch
- primary skill: `fg-owner-flow-trace`
- use when:
  - до patch нужен synthesis по owner / authority / identity / phase / mutation / failure
  - нужны и accepted context, и live code truth
- do not use when:
  - задача уже закрывается одним truth layer без synthesis

### Subsystem / boundary mapping
- primary skill: `fg-c4-system-map`
- use when:
  - нужен subsystem map
  - нужен boundary map
- do not use when:
  - задача локальная и не требует system map

### Decision already formed and needs structured capture
- primary skill: `fg-adr`
- use when:
  - решение уже созрело
  - его нужно зафиксировать как structured decision
- do not use when:
  - решение ещё не сформировано

### Risk-sensitive verification-heavy change
- primary skill: no primary override
- supporting skill: `qa-test-planner`
- use when:
  - нужен verification plan перед risky patch
- do not use when:
  - verification-heavy layer отсутствует
- important:
  - `qa-test-planner` — supporting skill, не primary routing layer

### Dead code / stale helpers / excess coupling
- primary skill: `reducing-entropy`
- use when:
  - задача про cleanup без change of intended behavior
- do not use when:
  - задача прежде всего feature / contract / ownership related

### Naming clarity
- primary skill: `naming-analyzer`
- use when:
  - проблема в semantic clarity names
- do not use when:
  - naming не является реальной problem layer

### Continuity capture
- primary skill: `session-handoff`
- use when:
  - нужно зафиксировать current closure / frontier / next safe step
- do not use when:
  - continuity capture не нужен

### Instruction-file restructuring
- primary skill: `agent-md-refactor`
- use when:
  - instruction files noisy / oversized / need progressive disclosure
- do not use when:
  - задача не про agent instruction packaging

## Mixed Flow Rules

Mixed flow использовать только если два разных truth types действительно нужны до safe analysis.

Базовые mixed flows:

### Upstream truth + chart reasoning
1. `Context7`
2. local FG docs / current-state / handoff
3. `fg-chart-architect`

### Accepted context + live code truth
1. authoritative repo truth check
2. `gbrain MCP`
3. Serena

### Accepted context + live code synthesis before patch
1. authoritative repo truth check
2. `gbrain MCP`
3. Serena
4. `fg-owner-flow-trace`

### Chart-related + library/API truth
1. `Context7`
2. `fg-chart-architect`
3. Serena only if later нужен live code truth

Mixed flow не включать:
- если одного truth layer уже достаточно;
- если второй tool добавляется “на всякий случай”;
- если repo truth ещё не поднят при необходимости.

## Tool Boundaries

### `Context7`
- upstream truth only
- не заменяет accepted project context
- не заменяет live code truth

### `gbrain MCP`
- accepted context retrieval only
- current stop-point / frontier / handoff narrowing
- не заменяет required repo sources
- не заменяет symbol-level code truth

### Serena
- live code truth only
- symbol references, readers / writers, call-flow, data-flow, mutation points
- не заменяет accepted contract truth
- не заменяет stable repo truth

### `Playwright MCP`
- verification route only
- использовать только когда runtime/browser evidence действительно нужен
- не default route для любого UI question

### `.serena/memories/*`
- helper recall only
- conventions / commands / completion support
- не authoritative truth layer
- не accepted context truth
- не stable architecture truth

## Use When / Do Not Use When

### `Context7`
Use when:
- external library / API / framework / SDK truth materially matters

Do not use when:
- вопрос можно закрыть accepted context + local code truth без upstream lookup

### `gbrain MCP`
Use when:
- нужен accepted context, stop-point, frontier, handoff narrowing

Do not use when:
- authoritative repo truth ещё не проверен при required-by-task repo layer
- нужен live code truth, а не accepted context

### Serena
Use when:
- нужны symbol refs, readers-writers, call-flow, data-flow, mutation points

Do not use when:
- вопрос прежде всего про accepted context или roadmap frontier

### `Playwright MCP`
Use when:
- нужен runtime/browser evidence

Do not use when:
- code truth или accepted context уже достаточно

### `.serena/memories/*`
Use when:
- нужен helper recall для conventions / commands / completion support

Do not use when:
- нужен authoritative project truth
- нужен accepted context truth

### `requirements-clarity`
Use when:
- scope неясен или ambiguity мешает routing

Do not use when:
- task class уже стабильно определён

### `fg-chart-architect`
Use when:
- задача chart-engine / viewport / navigation / ownership specific

Do not use when:
- задача не chart-specific

### `fg-owner-flow-trace`
Use when:
- нужен accepted context + live code synthesis before patch

Do not use when:
- задача не требует такого synthesis

### `fg-c4-system-map`
Use when:
- нужен subsystem / boundary map

Do not use when:
- задача локальна и map не нужен

### `fg-adr`
Use when:
- decision already formed and needs structured capture

Do not use when:
- решение ещё не сформировано

### `qa-test-planner`
Use when:
- нужен supporting verification plan перед risky patch

Do not use when:
- его пытаются использовать как primary routing layer

## Anti-Patterns

- не выбирать skill до `task_class` и `truth_needed_first`
- не пропускать шаг `repo_truth_required_first`
- не использовать `gbrain MCP` вместо required repo truth
- не использовать Serena для accepted-context questions
- не делать `Playwright MCP` default route для любого UI/runtime вопроса
- не forcing mixed flow, если одного source of truth достаточно
- не позволять routing imply patch readiness
- не использовать supporting skill как primary routing layer
- не использовать `.serena/memories/*` как truth layer

## Summary References

Source authority / memory conflict:
- `docs/project/policy/agent_authority_and_sources.md`

`REFRESH` completeness:
- `docs/project/policy/agent_refresh_bootstrap.md`

Chart-specific owner expectations:
- `docs/project/policy/agent_chart_workflow.md`

Execution rules:
- `docs/project/policy/agent_execution_contract.md`
