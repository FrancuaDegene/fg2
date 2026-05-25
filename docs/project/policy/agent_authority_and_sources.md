# Agent Authority and Sources

## Purpose

Этот файл — нормативное расширение root contracts для `authority order`, `source priority`, memory topology и conflict rules в FG.

Он фиксирует:
- какие источники считаются authoritative;
- какие источники являются supporting layer;
- кто выигрывает при конфликте;
- как агент должен различать durable truth, roadmap и helper context.

Этот файл не задаёт `bootstrap` details, `tool routing`, chart workflow или execution mechanics.

## Source Priority

### Для immediate next step

1. `docs/project/state/*`
2. relevant stable docs в `docs/domain/*`
3. `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`
4. `docs/project/sprint/*`
5. `.claude/handoffs/*`
6. `gbrain MCP`
7. `.serena/memories/*`
8. chat/session context

### Для architecture / ownership / boundaries

1. stable docs в `docs/domain/*`
2. `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`
3. `docs/project/state/*`
4. `docs/project/sprint/*`
5. `.claude/handoffs/*`
6. `gbrain MCP`
7. `.serena/memories/*`
8. chat/session context

Supporting domain refs:
- `docs/domain/chart-code-map.md`
- `docs/domain/chart-navigation.md`
- `docs/domain/chart-state-model.md`
- `docs/domain/moex-sessions.md`

Они помогают интерпретации, но не сильнее stable domain docs.

## Authoritative Current-State Rule

`docs/project/state/*` — главный источник для:
- current stop-point;
- immediate next step;
- current closed/open frontier;
- do-not-reopen zone на текущем stop-point.

Если `current-state` расходится с `handoff`, `gbrain MCP`, `.serena/memories/*` или chat по вопросу `what next now`, `current-state` wins.

## Stable Truth Rule

Stable truth для:
- architecture / ownership / boundaries;
- product / operating constraints

живёт в:
- stable docs в `docs/domain/*`;
- `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`;

Для chart-domain canonical stable truth прежде всего опирается на:
- `docs/domain/FG_CHART_ARCHITECTURE_MAP.md`;
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`;
- `docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md`.

Supporting refs, включая `chart-code-map.md`, не stronger truth than stable domain docs.

## Sprint Role

`docs/project/sprint/*` задаёт:
- roadmap;
- phase model;
- DoD;
- общий порядок движения по спринту.

Sprint помогает понимать фазу и направление, но не override `current-state` для immediate next step.

## Handoff Role

`.claude/handoffs/*` — это continuity layer:
- closure-chain;
- reasoning lineage;
- supporting narrowed continuation;
- session-to-session handoff context.

Handoff не является authoritative state и не заменяет `current-state` или stable docs.

## gbrain MCP Role

`gbrain MCP` — retrieval accelerator для accepted context:
- current stop-point narrowing;
- closed/open frontier retrieval;
- handoff narrowing;
- accepted context retrieval.

`gbrain MCP` не заменяет:
- authoritative repo truth;
- required source loading;
- `current-state`;
- stable docs.

## Serena Memory Role

`.serena/memories/*` — tool-local helper memory only.

Допустимая роль:
- conventions;
- commands;
- completion support;
- helper recall.

Недопустимая роль:
- authoritative project truth;
- override для `current-state`;
- override для stable docs.

## Conflict Resolution Rules

- Если `docs/project/state/*` расходится с `handoff`, `gbrain MCP`, `.serena/memories/*` или chat по immediate next step, `current-state` wins.
- Если stable docs расходятся с `handoff` или tool memory по architecture / ownership / boundaries, stable docs win.
- `FG DNA — CANONS...` задаёт product / philosophy / UX boundary и не должен проигрывать helper layers.
- `FG_ChatGPT_Session_Settings_v6.md` is ChatGPT/session reference only; it is not project authority and does not override durable repo truth.
- `handoff`, `gbrain MCP`, `.serena/memories/*` и chat могут помогать интерпретации, но не должны override authoritative repo truth.
- supporting refs, включая `chart-code-map.md`, lose to stable domain docs при конфликте интерпретации.
- `docs/project/policy/agent_*.md` — normative agent policy extensions of root contracts; они регулируют поведение агента, но не являются durable project truth.

## Handoff Narrowing Rule

Handoff narrowing допустим только после загрузки:
- authoritative `current-state`;
- relevant stable docs.

Если latest handoff сужает continuation дальше, чем `current-state`, агент обязан явно разделить:
1. authoritative next step from `current-state`;
2. supporting narrowed continuation from handoff.

Нельзя представлять handoff refinement как authoritative, если `current-state` не обновлён.

## Durable Truth vs Supporting Context

Durable project and operating truth:
- `docs/project/state/*`;
- stable docs в `docs/domain/*`;
- `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`;

Normative agent policy extensions:
- `docs/project/policy/agent_*.md`.

Они являются normative extensions of root contracts:
- `AGENTS.md`;
- `CODEX_RULES.md`.

Roadmap / continuity / helper context:
- `docs/project/sprint/*`;
- `.claude/handoffs/*`;
- `gbrain MCP`;
- `.serena/memories/*`;
- chat/session context.

Только durable truth layer устанавливает project truth.
Normative agent policy extensions регулируют, как агент читает и применяет truth.
Roadmap / continuity / helper context поддерживают интерпретацию, continuity и narrowing, но не создают authoritative truth сами по себе.
