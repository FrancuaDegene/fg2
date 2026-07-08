# FG Security Baseline and Socket Availability Validation Handoff

## Status

- ACTIVE
- SECURITY VALIDATION PENDING
- No runtime patch approved
- No automatic fix approved

## Purpose

Этот handoff фиксирует результаты первого repository-wide Codex Security scan и передает в следующую сессию один ограниченный security slice:

- подтвердить или скорректировать практический impact Socket.IO candle-stream availability finding;
- определить минимальную защиту без преждевременного внедрения auth-системы или широкого refactor.

## Authority Boundary

- этот handoff не заменяет FG DNA;
- не заменяет AGENTS.md;
- не заменяет CODEX_RULES.md;
- не заменяет accepted implementation contracts;
- не является разрешением на patch;
- не является доказательством полной безопасности FG;
- решения должны оставаться evidence-first и bounded.

## Scan Baseline

- Scanner: Codex Security
- Plugin version: 0.1.10
- Scan type: Codebase
- Scope: entire repository
- Deep scan: off
- Target commit:
  - short: 89520dc
  - full: 89520dcbdae59938df7ab2c26576c7f01d77d412
- Scan completeness: partial
- Inventory: 264 source-like rows
- Validation mode: static source trace
- Runtime load reproduction: not performed

Scan был формально завершён, но repository-wide deep review не закрыл весь deterministic worklist.

## Architecture Baseline

- external browser / Telegram client -> React / HTTP / Socket.IO;
- frontend -> backend1 / backend2;
- backend services -> MySQL / Redis;
- backend1 -> OpenAI API;
- operator configuration -> runtime.

FG имеет читаемый и моделируемый архитектурный каркас, но security enforcement публичных runtime-границ ещё не полностью hardened.

## Reportable Finding

Title:

Unbounded Socket.IO candle refresh work can enable service degradation

Classification:

- Severity: Medium
- Confidence: High
- CWE-400
- CWE-770
- Category: uncontrolled resource consumption / missing throttling

Affected files:

- backend1/app.js
- backend1/sockets/candlesSocket.js
- релевантный candle aggregation path, только для чтения при validation

Root cause:

HTTP route limiters защищают REST `/api/*`, но не отдельную Socket.IO surface.

`requestChartData` способен запустить recurring refresh timer, который вызывает `loadCandles()` и далее DB/cache-backed candle aggregation.

В просмотренном пути не доказаны:

- socket-specific authentication;
- per-IP quota;
- per-connection quota;
- explicit request-cost budget;
- global concurrent refresh-loop cap.

## Static Attack Path

unauthenticated or low-friction socket client
-> Socket.IO connection
-> requestChartData
-> loadCandles
-> getAggregatedCandles
-> recurring setInterval refresh
-> repeated MySQL / Redis work
-> possible availability degradation

## Evidence Boundary

### Proven statically

- Socket.IO является активной runtime surface.
- HTTP limiter middleware не покрывает Socket.IO events.
- `requestChartData` достигает candle aggregation path.
- accepted request может создать повторяющуюся серверную работу.
- в изученном пути отсутствует очевидный socket-specific budget control.

### Not yet proven

- точное количество соединений или loops, необходимое для деградации;
- реальная нагрузка на MySQL и Redis;
- наличие upstream connection limits;
- поведение через Nginx / load balancer / Selectel;
- возможность нескольких overlapping timers на одном socket;
- полнота cleanup при replacement request;
- полнота cleanup при disconnect;
- практический outage threshold.

Не утверждать, что FG можно положить одним запросом.

## Non-Findings From Reviewed Frontier

В просмотренной части не были подтверждены:

- remote code execution;
- SQL injection;
- tracked live-secret exposure;
- active React XSS sink;
- privilege escalation;
- critical authentication bypass;
- compromise of OpenAI API credentials.

Это не доказывает отсутствие этих проблем во всём репозитории, потому что scan completeness = partial.

## Deferred Security Surfaces

1. `trust proxy = 1` и `req.ip`-based rate limiting:
   - требуется фактическая deployment topology;
   - нужно понять число proxy hops и возможность прямого доступа к Node.

2. `backend2` REST and DB surface:
   - ключевые routes просмотрены;
   - полный review не закрыт.

3. supporting trees:
   - `.agents`
   - `skills`
   - `.claude`
   - другие non-primary source-like rows.

4. broader repository frontier:
   - оставшиеся строки deterministic 264-row inventory не считать reviewed.

## Current Decision

- не применять automatic fix;
- не внедрять полноценную auth-систему только ради этого finding;
- не переписывать Socket.IO architecture;
- не менять candle lifecycle до bounded validation;
- сначала провести отдельный read-only / test-only validation slice.

## Immediate Next Step

Создать следующий bounded security validation slice только для:

- backend1/app.js
- backend1/sockets/candlesSocket.js
- непосредственного candle aggregation/cache path
- deployment topology, если она доступна в repo docs/config

Validation goals:

1. Определить owner refresh timer.
2. Проверить, сколько timers может существовать на один socket.
3. Проверить replacement semantics после повторного `requestChartData`.
4. Проверить cleanup при disconnect.
5. Подтвердить или опровергнуть overlapping refresh loops.
6. Инструментировать вызовы `loadCandles` без production-like destructive load.
7. Выполнить bounded reproduction на безопасном числе соединений.
8. Измерить рост work относительно числа sockets и requests.
9. Проверить доступные upstream quotas и proxy limits.
10. После evidence предложить минимальный patch contract, но не применять его без отдельного approval.

## Candidate Minimal Controls

Следующие controls являются кандидатами для последующего решения и не являются approved implementation:

- один активный chart refresh loop на socket;
- guaranteed timer cleanup при replacement и disconnect;
- debounce или cooldown для `requestChartData`;
- per-connection request budget;
- per-IP socket budget;
- maximum concurrent chart streams;
- bounds для timeframe / interval / historical range;
- signed или authenticated socket session только при появлении соответствующего product contract.

## Guardrails

- Не смешивать validation и implementation.
- Не менять chart behavior без доказанного contract.
- Не ломать public chart UX.
- Не добавлять новую identity/auth architecture без отдельного решения.
- Не считать CORS заменой authorization или resource budget.
- Не считать HTTP rate limiter защитой Socket.IO.
- Не запускать destructive или uncontrolled load test.
- Не использовать production secrets.
- Не делать broad refactor.
- Любой patch — отдельный minimal reversible slice.
- После patch обязателен focused regression и runtime QA.

## Acceptance Criteria For Validation Slice

Validation считается завершённым, когда есть:

- точная timer lifecycle model;
- доказанное количество возможных active loops на socket;
- evidence cleanup при replacement/disconnect;
- bounded measurements или instrumented call counts;
- deployment/proxy assumptions;
- revised severity and confidence;
- accepted root cause;
- минимальный patch contract либо evidence для снижения severity;
- список regression tests;
- явный verdict:
  - CONFIRMED
  - CONFIRMED WITH LOWER IMPACT
  - NOT REPRODUCED
  - BLOCKED BY DEPLOYMENT EVIDENCE

## Closure Conditions

Этот active handoff можно архивировать только после одного из сценариев:

1. finding подтверждён, minimal patch применён, runtime QA пройден, commit создан;
2. finding снижен или отклонён на основании runtime/deployment evidence;
3. owner осознанно принимает риск и документирует accepted risk с trigger для возврата.

## Immediate Resume Prompt

- MODE: ANCHOR
- read-only first
- read this handoff
- inspect exact socket lifecycle
- no patch
- produce validation plan and evidence gaps
