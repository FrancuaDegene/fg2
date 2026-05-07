# FG Dependency Radar Policy — правила аудита зависимостей FG

## 1. Назначение

Этот документ задаёт правила регулярного аудита и обновления зависимостей FG.

Цель: не допускать ситуации, когда зависимости не проверяются 1–1.5 года, а затем проект внезапно упирается в большую major-миграцию.

Dependency Radar — это не процесс “обновить всё”.  
Dependency Radar — это процесс заранее увидеть риск, записать его, классифицировать и решить, что делать дальше.

Главная формула:

```text
Dependency Radar = detect → classify → decide → plan
не = auto-fix → broad update → surprise migration
```

## 2. Authority

Этот файл описывает процесс обслуживания зависимостей.

Он не заменяет и не перекрывает:

- `docs/project/state/FG_sources_ready_current_state_2026-04-04.md`
- stable architecture docs в `docs/domain/`
- sprint-файлы
- `AGENTS.md`
- `CODEX_RULES.md`
- active handoff

Для FG порядок источников остаётся прежним:

```text
current-state = authoritative stop-point / what-next-now
stable docs = architecture authority
sprint file = roadmap / phase tracking
handoffs = supporting evidence only
```

Этот файл отвечает только за dependency maintenance process.

## 3. Принципы

### 3.1. Надёжность

Обновление зависимости не считается успешным, пока не проверено поведение затронутого слоя.

Для chart/UI/runtime-зависимостей обязательна runtime QA-проверка.

### 3.2. Производительность

Обновление не должно ухудшать скорость загрузки, отрисовку графика, работу Socket.IO, API latency или background workers без явного решения.

Если влияние неизвестно — сначала spike.

### 3.3. Гибкость

Зависимости должны обновляться достаточно регулярно, чтобы проект не застревал на устаревших версиях и не накапливал слишком дорогие миграции.

Но гибкость не означает хаотичные обновления.

### 3.4. Минимальность

Один проход — одна dependency group.

Не смешивать:

- feature work;
- dependency update;
- refactor;
- architecture migration;
- security fix;
- style cleanup.

### 3.5. Обратимость

Каждое обновление должно иметь понятный rollback:

- какие файлы изменены;
- как откатить;
- какие команды проверки были выполнены;
- какой observable result был получен.

## 4. Календарь

### 4.1. Weekly Security Radar

Периодичность:

```text
1 раз в неделю
10–15 минут
```

Цель:

- найти срочные security-сигналы;
- не ждать месячного радара, если есть high/critical runtime risk;
- не делать массовые обновления.

Проверять:

- `npm audit`
- backend dependency warnings
- Python/Django/Celery dependency warnings
- Docker base image warnings
- known exploited vulnerabilities
- OpenAI / Telegram / HTTP client security notices

Результат:

```text
no action / watch / patch soon / emergency
```

### 4.2. Monthly Dependency Radar

Периодичность:

```text
первое воскресенье каждого месяца
30–45 минут
audit only
```

Цель:

- посмотреть, что устарело;
- записать major/minor/patch gaps;
- выделить risky dependencies;
- решить, что попадёт в отдельный update slice.

Важно:

```text
Monthly Radar не обновляет зависимости.
Monthly Radar только классифицирует и планирует.
```

### 4.3. Quarterly Modernization Window

Периодичность:

```text
1 раз в квартал
2–4 часа
```

Цель:

- планово обновить безопасные группы зависимостей;
- разобрать накопленные medium-risk обновления;
- проверить runtime / build / Docker base;
- пересмотреть major watchlist.

### 4.4. Major Migration Spike

Любая major-версия требует отдельного spike.

Major нельзя смешивать с обычным monthly update.

Для major нужно:

- прочитать changelog / migration guide;
- проверить breaking changes;
- найти затронутые FG layers;
- составить plan / rollback;
- сделать минимальный proof-of-compatibility;
- только потом принимать решение о миграции.

## 5. Классы зависимостей FG

### 5.1. Runtime dependencies

Зависимости, влияющие на работу приложения у пользователя или сервера.

Примеры:

- `react`
- `react-dom`
- `lightweight-charts`
- `express`
- `socket.io`
- `axios`
- MySQL client
- Redis client
- Django
- Celery
- OpenAI SDK
- Telegram SDK / bot libraries

Приоритет: высокий.

### 5.2. Chart-critical dependencies

Зависимости, которые могут изменить поведение графиков, Expanded mode, indicators, panes, time scale, visible range или rendering lifecycle.

Примеры:

- `lightweight-charts`
- `react`
- `react-dom`
- `vite`
- date/time libraries
- chart-related workers
- rendering utilities

Правило:

```text
Chart-critical dependency обновляется отдельным slice.
Нельзя обновлять её вместе с unrelated packages.
```

### 5.3. Build dependencies

Зависимости сборки и tooling.

Примеры:

- с unrelated packages.
```

### 5.3. Build dependencies

Зависимости сборки и tooling.

Примеры:

- `vite`
- TypeScript
- Babel / SWC / esbuild
- PostCSS
- ESLint
- test runners
- Playwright

Риск:

- сборка может перестать проходить;
- dev server может измениться;
- sourcemaps / env behavior могут измениться;
- тесты могут начать падать из-за tooling, а не из-за product code.

### 5.4. Dev/test dependencies

Зависимости, которые не идут в runtime, но влияют на качество проверки.

Примеры:

- test frameworks
- linters
- formatters
- mocks
- QA helpers

Они обычно ниже runtime по риску, но не должны забываться на годы.

### 5.5. Infrastructure dependencies

Инфраструктурные зависимости.

Примеры:

- Docker base images
- Node runtime image
- Python runtime image
- OS packages inside containers
- npm / pip / uv tooling
- Redis / MySQL image versions

Правило:

```text
Runtime base нельзя забывать на годы.
```

### 5.6. Security-sensitive dependencies

Зависимости, которые особенно важны для безопасности.

Примеры:

- HTTP clients
- file upload libraries
- parsers
- auth/session/cookie libraries
- webhook handlers
- OpenAI SDK
- Telegram bot SDK
- SSRF-adjacent fetchers
- news aggregation fetchers

Для FG особенно важны:

- SSRF;
- secrets exposure;
- unsafe outbound HTTP;
- webhook validation;
- dependency compromise;
- supply-chain risk.

## 6. Risk levels

### 6.1. Emergency

Используется, если есть:

- critical runtime vulnerability;
- known exploitation;
- exposed secret risk;
- remote code execution risk;
- auth/session compromise;
- dangerous dependency compromise.

Действие:

```text
Emergency patch отдельной веткой.
Никаких feature changes.
Evidence + rollback обязательны.
```

### 6.2. High

Используется, если:

- runtime dependency имеет high vulnerability;
- dependency затрагивает server-side request / auth / webhook / file parsing;
- есть доступный patch/minor fix;
- есть высокий риск накопления technical debt.

Действие:

```text
patch soon
один dependency group
runtime QA
```

### 6.3. Medium

Используется, если:

- minor update накопился;
- есть deprecation warning;
- package активно используется;
- major уже появился, но текущая версия ещё поддерживается.

Действие:

```text
watch / plan slice / quarterly window
```

### 6.4. Low

Используется, если:

- dev-only dependency;
- patch update без явных breaking changes;
- низкий security impact;
- нет runtime exposure.

Действие:

```text
monthly or quarterly update
```

### 6.5. Watch

Используется, если:

- появился major, но миграция не срочная;
- dependency пока работает;
- risk не доказан;
- нужен changelog review.

Действие:

```text
record in watchlist
review next radar
```

## 7. Decision types

Каждый найденный сигнал должен получить одно решение:

```text
ignore
watch
patch
minor update
major spike
security emergency
defer with reason
```

Запрещено оставлять сигнал без решения.

Даже решение “ничего не делаем” должно иметь причину.

## 8. Monthly checklist

Во время Monthly Dependency Radar проверить:

### 8.1. Frontend

Команды:

```bash
npm outdated
npm audit
```

Проверить:

- `react`
- `react-dom`
- `vite`
- `lightweight-charts`
- `axios`
- `socket.io-client`
- chart-related packages
- test/build packages

### 8.2. Backend Node

Проверить:

- `express`
- `socket.io`
- `axios`
- MySQL client
- Redis client
- OpenAI SDK
- Telegram-related dependencies
- auth/session/cookie dependencies
- parser/file-upload dependencies

### 8.3. Python / Django / Celery

Проверить:

- Django
- Celery
- Redis integrations
- HTTP clients
- parsers
- security-sensitive packages

### 8.4. Docker / runtime

Проверить:

- Node base image
- Python base image
- OS package age
- Redis/MySQL image compatibility
- Dockerfile warnings
- deprecated runtime versions

### 8.5. Major watchlist

Записать все major updates по критичным пакетам:

- package;
- current version;
- latest version;
- migration risk;
- changelog/migration guide status;
- suggested spike date.

### 8.6. Deprecated / EOL watchlist

Проверить:

- deprecated packages;
- unsupported runtime versions;
- warnings from install/build;
- unsupported Docker images;
- ecosystem migration notices.

## 9. Patch rules

### 9.1. One dependency group at a time

Примеры dependency group:

```text
lightweight-charts only
React + React DOM only
Vite/build stack only
Express/server runtime only
Socket.IO client/server only
axios only
Docker Node runtime only
Django/Celery only
OpenAI SDK only
Telegram SDK only
```

### 9.2. No broad update

Запрещено:

```bash
npm update
npm audit fix --force
```

без отдельного анализа и разрешения.

### 9.3. No feature work

Dependency branch не должен содержать feature changes.

Разрешены только:

- dependency version changes;
- минимальные compatibility fixes;
- test updates;
- docs notes;
- lockfile changes.

### 9.4. Changelog first

Перед minor/major обновлением читать:

- changelog;
- release notes;
- migration guide;
- breaking changes;
- deprecations;
- peer dependency changes.

### 9.5. Runtime QA required

Для runtime/chart/UI/server зависимостей обязательно:

- run app;
- check console;
- check core flow;
- for chart: check Compact / Expanded;
- for indicators: MA / EMA / RSI / Volume if chart layer touched;
- for backend: check API / socket / worker flow;
- record target/action/result/observable effect/blocker.

## 10. Major migration gate

Major migration разрешена только если есть отдельный spike.

Spike должен ответить:

```text
Что изменилось?
Какие breaking changes?
Какие FG layers затронуты?
Есть ли compatibility shim?
Можно ли мигрировать one file / one layer at a time?
Какой rollback?
Какие runtime QA scenarios обязательны?
Что откладываем?
```

Major migration не считается patch.

Major migration — это отдельная архитектурная задача.

## 11. Emergency security gate

Security emergency может обойти monthly cadence.

Но даже emergency не отменяет evidence.

Минимальные требования:

```text
vulnerability source
affected package
current version
fixed version
runtime/dev-only classification
reachable/not reachable estimate
exploitability note
patch plan
rollback plan
verification
```

Если exploitability неизвестна, писать:

```text
exploitability unknown
```

Не придумывать exploit path без evidence.

## 12. FG critical dependency list

### 12.1. Chart / UI

```text
lightweight-charts
react
react-dom
vite
date/time utilities
chart workers
```

### 12.2. Frontend data / transport

```text
axios
socket.io-client
```

### 12.3. Backend Node

```text
express
socket.io
axios
mysql client
redis client
OpenAI SDK
Telegram SDK / bot libraries
```

### 12.4. Python services

```text
Django
Celery
Redis integration
HTTP clients
parsers
```

### 12.5. Infrastructure

```text
Docker Node base image
Docker Python base image
Redis image
MySQL image
npm
pip / uv
```

## 13. Do-not rules

Запрещено:

```text
Do not run npm audit fix --force blindly.
Do not upgrade many unrelated packages in one patch.
Do not mix dependency upgrade with feature work.
Do not migrate a major library without spike.
Do not treat audit count as severity.
Do not update chart-critical dependencies without runtime visual QA.
Do not update Docker/runtime base silently.
Do not accept auto-merge for dependency bots.
Do not trust green install as proof of runtime safety.
Do not ignore peer dependency warnings on runtime packages.
Do not update lockfile-only without understanding why it changed.
```

## 14. Output template для Dependency Radar

Каждый Dependency Radar должен завершаться короткой записью.

```markdown
# FG Dependency Radar — YYYY-MM-DD

## Scope

Что проверялось:

- frontend
- backend Node
- Python/Django/Celery
- Docker/runtime
- security
- chart-critical dependencies

## Commands / signals

Команды или источники:

```bash
npm outdated
npm audit
```

Другие сигналы:

- changelog scan:
- Docker image check:
- security advisory:
- deprecation warning:

## Findings

### Emergency

- none / list

### High

- package:
- current:
- latest/fixed:
- reason:
- decision:

### Medium

- package:
- current:
- latest:
- reason:
- decision:

### Low

- package:
- current:
- latest:
- reason:
- decision:

### Watchlist

- package:
- current:
- latest:
- why watch:
- next review:

## Decisions

- ignore:
- watch:
- patch:
- minor update:
- major spike:
- security emergency:

## Next slice

Следующий безопасный dependency slice:

```text
package/group:
reason:
expected files:
runtime QA:
rollback:
```

## Deferred

Что отложено и почему:

- item:
- reason:
- revisit date:

## Notes

Дополнительные наблюдения:

-
```

## 15. Calendar rule

Постоянное правило:

```text
Первое воскресенье каждого месяца = FG Dependency Radar.
Длительность: 30–45 минут.
Режим: audit only.
Цель: увидеть риск, записать решение, не чинить всё сразу.
```

Если первое воскресенье пропущено, radar переносится на ближайший рабочий день, но не отменяется.

## 16. Automation policy

Dependency automation можно подключать только после отдельного решения.

Разрешено рассмотреть позже:

- Dependabot;
- Renovate;
- Docker image scanning;
- GitHub security alerts;
- SBOM tooling.

До отдельного решения запрещено:

- auto-merge dependency PR;
- automatic major updates;
- automatic runtime dependency updates;
- automatic lockfile rewrite without review.

## 17. When to create a skill

Не создавать skill сразу.

Сначала этот policy-файл должен пройти несколько реальных Dependency Radar сессий.

Создать `.agents/skills/fg-dependency-radar/` только если процесс станет повторяемым и стабильным.

Критерии для skill:

- radar проведён минимум 2–3 раза;
- checklist стабилизировался;
- output format доказал пользу;
- появились повторяемые команды;
- понятны boundaries и do-not rules.

## 18. Current FG decision

На момент создания этого policy:

```text
Не обновлять зависимости прямо сейчас.
Не запускать npm audit fix.
Не запускать npm audit fix --force.
Не ставить dependency bots.
Не создавать новый skill.
Сначала завершить LWC spike / decision.
После LWC — начать dependency modernization отдельными slices.
```

## 19. Summary

FG Dependency Radar нужен, чтобы dependency debt не становился внезапной архитектурной проблемой.

Главное правил
::contentReference[oaicite:1]{index=1}
:

```text
Сначала увидеть и классифицировать.
Потом планировать.
Только потом обновлять.
```