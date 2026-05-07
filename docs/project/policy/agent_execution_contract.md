# Agent Execution Contract

## Purpose

Этот файл — нормативное расширение root execution contract для mode ladder, patch / execute boundaries, anchor requirement, file modification rules, terminal / git rules, subagent rules, runtime evidence format, output discipline, wait state и failsafe в FG.

Он фиксирует:
- полный execution behavior по режимам;
- что `PATCH` и `EXECUTE` — не одно и то же;
- какие execution actions запрещены по умолчанию;
- какие evidence и output requirements обязательны.

Этот файл не задаёт source priority canon, `REFRESH` bootstrap canon, tool routing canon или chart workflow canon.

## Default Flow

Базовый execution flow:

`REFRESH -> QUESTIONS or PLAN -> PATCH -> EXECUTE -> TEST -> ROLLBACK -> NOTES`

`REFRESH` — default entry для serious FG technical sessions.
`QUESTIONS` обязательны, если ambiguity не снята после `REFRESH`.
`PLAN` допустим после `REFRESH`, если evidence уже достаточен.

## Mode Ladder

Предпочтительная последовательность режимов:
- `REFRESH`
- `QUESTIONS` or `PLAN`
- `PATCH`
- `EXECUTE`
- `TEST`
- `ROLLBACK`
- `NOTES`

Каждый ответ обязан явно указывать текущий `MODE`.

## MODE REFRESH

Purpose:
- load operating rules;
- load relevant project docs / handoff;
- load upstream evidence first when library / API truth matters;
- separate locked decisions from open frontier;
- define scope guardrails before task-specific analysis.

Allowed output:
- loaded context ledger;
- locked decisions ledger;
- open frontier ledger;
- scope guardrails;
- evidence gaps;
- next analysis entry point.

Forbidden:
- no patches;
- no refactors;
- no implementation plan beyond next analysis target;
- no speculative architectural claims without evidence.

## MODE QUESTIONS

Purpose:
- reduce ambiguity and risk only when `REFRESH` was insufficient.

Rules:
- ask concise risk-reducing questions;
- no code;
- no diffs;
- no file modifications;
- no drifting into implementation before answers.

## MODE PLAN

Purpose:
- provide task-specific analysis or anchor plan.

Rules:
- concise plan;
- explicit anchors: file paths + line / section anchors when available;
- ownership / data-flow / boundary notes when relevant;
- no code diffs unless user explicitly asks for `PATCH`.

## MODE PATCH

Purpose:
- provide a unified diff for exactly one file.

Rules:
- one `PATCH` = one file by default;
- do not apply automatically;
- no formatting-only changes unless explicitly requested;
- no hidden side changes.

## MODE EXECUTE

Purpose:
- apply only the previously agreed patch.

Rules:
- exact previously agreed target;
- exactly one file unless user explicitly approved a multi-file step;
- no additional changes;
- no background execution.

## MODE TEST

Purpose:
- verification only.

Rules:
- commands may be listed as text;
- manual checks may be described;
- terminal use is still controlled by terminal rules below.

## MODE ROLLBACK

Purpose:
- provide rollback steps or reverse diff.

Rules:
- never perform rollback automatically.

## MODE NOTES

Purpose:
- summarize outcome, risks, boundaries, or follow-up status.

Rules:
- no code changes.

## PATCH and EXECUTE Boundary

`PATCH` и `EXECUTE` — не одно и то же.

`PATCH`:
- предлагает diff;
- не применяет изменения;
- не даёт права автоматически менять файлы.

`EXECUTE`:
- применяет только ранее согласованный patch;
- не расширяет scope;
- не добавляет побочных изменений.

Patching без явной команды `EXECUTE` не допускается.

## Anchor Requirement

Любой serious analysis, который может повлиять на changes, обязан включать:
- file path;
- exact anchor или line range, если доступно;
- ownership / data-flow note, если релевантно;
- explicit boundary того, что в scope и что вне scope.

No patching without anchors.

## File Modification Rules

- Нельзя изменять файлы без явной команды `EXECUTE`.
- Нельзя infer permission из контекста.
- Нельзя auto-apply changes.
- Нельзя использовать background agents для code changes.

Базовый execution guardrail:
- one patch by default = one file;
- additional file требует explicit justification;
- change должен оставаться bounded, minimal и reversible;
- не делать `while we are here` expansion.

## File Creation and Deletion Rules

- file creation is forbidden by default;
- file deletion is forbidden by default;
- допустимо только при явной команде пользователя с exact paths.

## Terminal and Git Rules

Terminal execution is not assumed by default.

Execution rules:
- не опираться на terminal execution для reasoning;
- если verification commands нужны, их можно перечислять как text в `MODE: TEST`.

Если `VS Code` просит terminal approval:
- default user response = `No`;
- разрешать только когда пользователь явно хочет terminal-backed verification.

Git rules:
- не создавать commits;
- не auto-stage changes;
- не выполнять destructive git actions.

## Background Agents and Subagents

Background agents are forbidden for code changes.

Subagents are allowed only for narrow evidence gathering:
- searching codebase;
- locating anchors;
- listing files or references;
- other bounded evidence-only work.

Subagents must not:
- propose independent patches;
- modify files;
- bypass main agent control.

Subagents must return control to main agent before `PLAN`, `PATCH` or `EXECUTE`.

## Runtime Evidence Format

Если задача затрагивает runtime / UI / browser behavior, claims требуют observable evidence.

Runtime evidence format обязан различать:
- target found;
- action attempted;
- action succeeded / failed;
- observable effect detected;
- blocker if failed.

Rules:
- code-level reasoning alone недостаточен для runtime confirmation;
- `architecture-safe` не означает `visual-safe`;
- нельзя forcing parity между `compact` и `expanded` без evidence.

Если risky or foundation slice later reaches patch-ready diff:
- сразу дать runtime QA prompt;
- перечислить `3–6` required scenarios;
- не ждать отдельного запроса на QA prompt.

## Output Format Rules

Каждый ответ обязан:
- явно указывать `MODE`;
- быть short и structured по умолчанию;
- явно маркировать missing files, если это релевантно;
- явно маркировать mismatch, если `current-state` и `handoff` расходятся;
- явно говорить, если `REFRESH` был incomplete;
- не выдавать incomplete refresh за полный authoritative refresh.

Если uncertain:
- stop;
- explain what is missing;
- ask for clarification or evidence.

## Wait State

После завершения текущего `MODE` агент должен stop and wait for the next explicit instruction,
если только пользователь явно не запросил multi-step sequence.

## Failsafe

Если какое-либо правило конфликтует с safe task completion:
- stop;
- explain the conflict;
- propose the narrowest safe next step;
- wait for user decision.
