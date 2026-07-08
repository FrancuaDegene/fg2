# AGENTS.md

## Role

Этот файл задает короткую root-ориентацию для AI coding agents в FG.

- Подробные правила живут в связанных policy-файлах.
- Repo evidence, Project Sources и current-state сильнее памяти, tool output и chat context.
- Этот файл объясняет, как думать и куда смотреть, а не дублирует весь policy layer.

## Project Snapshot

FG - инвестиционная аналитика для MOEX с Compact/Expanded charts, news layer и Telegram/MiniApp интеграцией.

- Domain и chart knowledge живут в `docs/domain/*`.
- Chart analysis должен учитывать Compact/Expanded роли и accepted boundaries.
- Intentional decisions не переоткрываются без genuinely new evidence.

## Core Thinking Rules

- WHY before HOW: сначала цель, ограничения, риски.
- Не patch from symptom alone.
- Базовая цепочка: symptom -> layer -> owner -> evidence -> patch.

Для серьезных FG decisions используй полную цепочку:

symptom
-> object/layer
-> owner
-> authority
-> identity
-> phase
-> mutation
-> failure
-> conflict/boundary
-> evidence
-> decision/patch

## Source And Authority

Начинай source routing с `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`.

- Current-state wins для stop-point и immediate next step.
- Stable/domain docs задают architecture/product boundaries в своей зоне.
- Sprint docs дают roadmap/phases/DoD, но не сильнее current-state.
- Handoffs, `gbrain`, Serena memory, tool output и chat context - supporting only, если policy явно не говорит иначе.
- `docs/project/policy/FG_ChatGPT_Session_Settings_v6.md` - ChatGPT/session reference only, not Codex project authority.

Детальный authority canon: `docs/project/policy/agent_authority_and_sources.md`.

## Routing

- External library/API/framework/SDK truth -> Context7 first.
- Tool и skill routing -> `docs/project/policy/agent_tool_routing.md`.
- Subagents - adaptive evidence-lane routing, not power mode.
- One connected owner-flow -> solo.
- 2+ genuinely independent evidence lanes -> minimal sufficient subagents.
- Subagent canon -> `docs/project/policy/agent_subagent_routing.md`.

### Conditional UX policy routing

- Before making or changing a user-facing decision that can alter what
  the user notices, understands, trusts, or feels expected to do, read
  `docs/project/policy/ux_cognitive_guardrails.md`.

- This includes hierarchy, placement, ordering, visibility, emphasis,
  wording, color meaning, defaults, interaction logic, states,
  notifications, AI output, signals, and recovery semantics.

- Skip this policy for purely mechanical or non-user-facing work and
  for exact implementation of an approved bounded contract.

- If mechanical work reveals an unapproved UX ambiguity, stop, read the
  policy and relevant contract, and report the authority gap before
  proceeding.

## Change Discipline

- Minimal localized change.
- One file per patch by default.
- No broad refactors without explicit approval.
- No "while we are here" expansion.
- Trade-offs must be explicit: what improves, what stays same, what could regress.
- Runtime/UI/browser claims need observable evidence.
- `architecture-safe` does not mean `visual-safe`.

Execution details live in `docs/project/policy/agent_execution_contract.md`.

## Chart Work

Для chart-related задач:

- Сначала owner/authority/boundary reasoning, потом anchors, потом patch discussion.
- Не force parity между `compact` и `expanded` без evidence.
- Не reopen closed chart slices без genuinely new runtime or repo evidence.

Chart workflow details: `docs/project/policy/agent_chart_workflow.md`.

## Local Environment Note

Codex может работать в шумной Windows/PowerShell среде.

- Prefer `rg` when available.
- Если `rg`, PowerShell или Codex shell шумит/ломается, используй safe fallback search/read.
- Не менять shell profile, ExecutionPolicy, PATH, Codex config, MCP config или tool config без explicit request.
- Environment noise не является причиной менять repo/config.

## Linked Policies

- `docs/project/policy/agent_authority_and_sources.md` - authority order, source priority, memory conflict rules.
- `docs/project/policy/agent_refresh_bootstrap.md` - full `REFRESH` / bootstrap contract.
- `docs/project/policy/agent_tool_routing.md` - MCP, tool и skill routing.
- `docs/project/policy/agent_subagent_routing.md` - solo/subagents routing и minimal worker-count discipline.
- `docs/project/policy/agent_chart_workflow.md` - chart-specific workflow и expectations.
- `docs/project/policy/agent_execution_contract.md` - execution mechanics, patch/execute boundaries, runtime evidence.

## What This File Is NOT

- not a permission file;
- not current-state;
- not sprint authority;
- not a substitute for `CODEX_RULES.md`;
- not a substitute for detailed `docs/project/policy/agent_*.md`;
- not a license to modify code freely.

## Final Rule

When in doubt:

- refresh context;
- verify ownership;
- check evidence;
- explain trade-offs;
- decide or patch only within scope.

Predictability and UX stability are more important than cleverness.
