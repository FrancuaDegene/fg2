# FG Active Source Pack

## 1. Purpose

Этот файл является каноническим routing manifest для текущего рабочего контекста FG.

Он определяет, какие sources считаются always-on, какие sources ротируются вместе с active sprint, какие domain packs подключаются условно, и какие архивные материалы остаются только background.

Этот файл не является sprint history, backlog или заменой active current-state file и domain documentation.

## 2. Current Work Status

- current active sprint: `not activated yet / pending next sprint bootstrap`
- previous sprint: `FG Chart Architecture Stabilization Sprint — fully administratively closed`
- current authoritative transition stop-point: `docs/project/state/FG_sources_ready_current_state_2026-04-04.md`
- current next safe entry: `bootstrap / activate the next sprint from its own authoritative Project Sources and current-state`

## 3. Authority Order

Текущий source routing order в transition state:

1. `FG_ACTIVE_SOURCE_PACK.md` — source routing entry point.
2. Active authoritative current-state file.
3. Active sprint roadmap / contract после sprint activation.
4. Relevant domain pack только когда задача этого требует.
5. Archived sprint memory только как background.
6. Handoffs только как supporting continuity.
7. `gbrain` как retrieval helper, никогда как source-of-truth replacement.

Этот файл маршрутизирует к authority. Он не override actual current-state file.

## 4. Always-On FG Core Sources

- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`

Эти sources задают stable FG policy / working discipline и не ротируются per sprint.

### ChatGPT/session reference only

- `docs/project/policy/FG_ChatGPT_Session_Settings_v6.md`
  - Purpose: ChatGPT-facing session settings/reference.
  - Not part of Codex active source-chain.
  - Not project authority or sprint authority.
  - Does not override `AGENTS.md`, `CODEX_RULES.md`, `docs/project/policy/agent_*.md`, current-state, or active Project Sources.

## 5. Active Sprint Pack

Current active sprint pack:

- `status: pending activation`
- `authoritative current-state: not yet assigned beyond transition current-state`
- `sprint roadmap / contract: not yet assigned`
- `active plan files: none`

Когда новый sprint будет активирован, этот раздел должен быть обновлён первым.

## 6. Domain Packs

### Chart Domain Pack

Использовать, когда задача затрагивает:

- chart architecture;
- indicators;
- timeframe × interval;
- chart ownership;
- chart runtime/render/navigation;
- chart QA or chart frontiers.

Files:

- `docs/domain/FG_CHART_ARCHITECTURE_MAP.md`
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
- `docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md`

Не загружать Chart Domain Pack по умолчанию для unrelated non-chart sprint work.

## 7. Archived Sprint Memory

Архивные surfaces закрытого chart sprint, сохранённые только как background:

- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_chart_architecture_stabilization_sprint_v1.1.md`
- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_phase_9_indicator_visual_behavior_plan.md`
- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_chart_architecture_stabilization_sprint_closure_review.md`
- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_chart_architecture_stabilization_sprint_retrospective.md`

Эти файлы являются historical / background only. Они не являются mandatory bootstrap sources для next sprint и не сильнее active current-state.

## 8. Tool Routing Note

Project Sources и repo docs остаются authority.

`gbrain` может помогать доставать accepted context, handoffs и closed/open frontier memory.

`gbrain` не заменяет этот manifest, current-state или stable docs.

## 9. Update Rules

Обновлять этот файл, когда:

- активируется новый sprint;
- меняется authoritative current-state file;
- меняется active sprint roadmap / contract;
- domain pack становится mandatory или retired;
- меняется список archived sprint memory, который нужно retain.

Не использовать этот файл как session log. Не dumping sprint history в этот файл.
