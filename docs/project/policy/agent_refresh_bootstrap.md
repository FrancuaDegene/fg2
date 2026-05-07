# Agent Refresh Bootstrap

## Purpose

Этот файл — нормативное расширение root contracts для `REFRESH`, bootstrap order, required core sources, completeness rule и поведения при incomplete `REFRESH` в FG.

Он фиксирует:
- когда `REFRESH` обязателен;
- какие repo sources считаются required core sources;
- в каком порядке поднимать bootstrap;
- когда `REFRESH` считается complete или incomplete;
- как маркировать missing / unavailable sources;
- какой safe next step допустим после `REFRESH`.

Этот файл не задаёт source priority canon, tool routing canon, chart workflow или execution mechanics вне `REFRESH` discipline.

## When REFRESH Is Mandatory

`REFRESH` обязателен для serious FG sessions, когда:
- затронуты `chart-engine`, ownership, state, data-flow, `MultiPane`, `ChartCanvas` или navigation;
- задача является `RISKY`;
- нужны project docs, `current-state`, accepted boundaries или continuity context;
- prior decisions must be preserved;
- важна external library / API / framework truth.

`REFRESH` может быть пропущен только если одновременно выполняются все условия:
- задача clearly `LOW-RISK`;
- ownership ambiguity отсутствует;
- project memory refresh не нужен;
- external API / library truth не нужен.

## Required Core Sources

Required core sources для serious FG sessions normally include:
- `AGENTS.md`;
- `CODEX_RULES.md`;
- `docs/project/policy/FG_ChatGPT_Session_Settings_v6.md`;
- `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`;
- `docs/project/state/*`;
- relevant stable docs в `docs/domain/*`;
- `docs/project/sprint/*`, когда важен roadmap / phase context;
- latest relevant handoff only when continuity / closure-chain / frontier narrowing is needed.

Supporting tool layers могут использоваться только если это реально нужно:
- `gbrain MCP`;
- Serena;
- `.serena/memories/*`;
- `docs/qa/playwright/*`.

Они не заменяют required repo sources.

`Context7` не является required core source always,
но становится required upstream source when external library / API / framework truth materially matters.

## Refresh Order

Базовый порядок `REFRESH`:

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/policy/FG_ChatGPT_Session_Settings_v6.md`
4. `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`
5. `docs/project/state/*`
6. relevant stable docs в `docs/domain/*`
7. `docs/project/sprint/*`, когда важен roadmap / phase context
8. latest relevant handoff only when нужен continuity / closure-chain / frontier narrowing
9. supporting tool layers only if relevant

Если активная задача затрагивает external library / API truth, сначала нужно поднять `Context7` evidence до архитектурных или code-level claims.

После загрузки источников агент обязан:
- отделить locked decisions от open frontier;
- зафиксировать evidence gaps;
- определить next analysis entry point.

## Completeness Rule

`REFRESH` считается complete только если все required core sources для текущей задачи были:
- реально загружены;
- или явно помечены как missing / unavailable;
- или явно помечены как not needed for this task, если источник не обязателен в данном контексте.

Пометка `not needed for this task` допустима только для источника, который не является required-by-task в текущем контексте.

`REFRESH` не считается complete, если required source был пропущен молча.

Handoff narrowing допустим только после загрузки authoritative `current-state` и relevant stable docs.

## Missing and Unavailable Sources

Если required source отсутствует или недоступен, агент обязан:
- назвать его явно;
- пометить его как `missing` или `unavailable`;
- не подменять его handoff, `gbrain MCP`, `.serena/memories/*` или chat memory;
- явно зафиксировать resulting evidence gap.

Если optional source в этой задаче не нужен, его нужно помечать как `not needed`, а не оставлять неявным.

## Expected REFRESH Output

Корректный `REFRESH` должен вернуть:
- loaded context ledger;
- locked decisions ledger;
- open frontier ledger;
- scope guardrails;
- evidence gaps;
- next analysis entry point.

При необходимости агент также должен явно указать verdict:
- `REFRESH complete`
- или `REFRESH incomplete`

## Incomplete REFRESH Behavior

Если `REFRESH` incomplete, агент обязан:
- явно сказать, что `REFRESH incomplete`;
- перечислить exact missing / unavailable sources;
- ограничить выводы evidence boundary;
- не делать сильных архитектурных выводов;
- не сужать frontier слишком агрессивно;
- не переходить к patch readiness;
- сначала зафиксировать evidence gap.

Incomplete `REFRESH` нельзя выдавать за полный authoritative refresh.

## Safe Next Step After REFRESH

Safe next step after `REFRESH`:
- task-specific analysis target;
- или `QUESTIONS`, если ambiguity не снята;
- или `PLAN`, если evidence уже достаточен.

Safe next step after incomplete `REFRESH`:
- закрыть evidence gaps;
- или явно продолжать только в ограниченном analysis scope.

`PATCH` не является частью `REFRESH` stage.
После `REFRESH` допустим следующий analysis step, а не автоматический переход к patching.
