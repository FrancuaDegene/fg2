Работаем внутри FG Project.

Сначала используй только Project Sources этого проекта.
Не используй connectors/apps и не ищи во внешних источниках, если я этого отдельно не просил.
Не отвечай по памяти, пока не поднят контекст из Project Sources.

Нужные Project Sources:

1) policy / session rules:
- FG_ChatGPT_Session_Settings_v6.md
- FG DNA — CANONS v1.4 (WORKING).md

2) stable architecture docs:
- FG_CHART_ARCHITECTURE_MAP.md
- FG_CHART_ENGINE_PLAYBOOK.md
- FG_CHART_STABILIZATION_PLAYBOOK.md

3) sprint contract:
- Спринт стабилизации архитектуры chart-domain v1.1.md

4) current state / latest checkpoint:
- FG_sources_ready_current_state_2026-04-04.md

Правила чтения:
- FG_sources_ready_current_state_2026-04-04.md = latest current state / authoritative stop-point
- sprint file = roadmap / phases / DoD
- architecture/playbook/stabilization docs = stable chart-system map
- FG DNA + chatgpt rules = project policy / session mode
Priority rule for context resolution:
- current state file = authoritative truth for current stop-point and "what next now"
- stable architecture docs = authoritative chart-system map and accepted boundaries
- sprint contract = roadmap / phase structure / DoD, but does not override current stop-point
- if sprint and current-state differ on the next immediate step, current-state wins

Перед bootstrap summary сначала коротко выведи:
- Loaded Project Sources:
- Missing Project Sources (if any):
- Authoritative current-state file:

Если какой-то файл из списка не найден, явно перечисли его и не делай молчаливых допущений.

Сначала сделай bootstrap summary только по Project Sources, без памяти, в таком порядке:
1. На каком спринте работаем
2. Какие задачи / фазы уже закрыты
3. Какая текущая стадия / stop-point
4. Что является следующим правильным шагом
5. Какие closed slices нельзя переоткрывать без new evidence
6. Какие frontier остаются открытыми
7. Какие правила работы в этой сессии обязательны

В конце summary добавь:
- Source coverage check:
  - policy/rules loaded: yes/no
  - FG DNA loaded: yes/no
  - stable architecture docs loaded: yes/no
  - sprint contract loaded: yes/no
  - current state loaded: yes/no

Если Project Sources в этой сессии недоступны, не переходи в connectors/apps и не ищи во внешних источниках.
Вместо этого сразу напиши:
"Project Sources are not available in this chat/project."

Обязательный session mode:
- MODE = EXPLORE по умолчанию
- сначала WHY (цель / ограничения / риски), потом HOW
- SHORT по умолчанию; FULL только если я явно попросил или задача реально рискованная / большая
- не гадать
- patch без фактов запрещён
- не смешивать current state с timeline/history
- компромиссы фиксировать явно: что выиграли, что ухудшили, почему это приемлемо

Правила tool-routing:
- Если вопрос про library / framework / SDK / API / версии / сигнатуры методов / best practices:
  - сначала Context7
  - потом выводы
- Если нужно восстановить owner / authority / identity / phase / mutation / failure, а также handoff / call-flow / data flow по локальной кодовой базе:
  - сначала Serena-first anchor
  - start with search_for_pattern, then narrow to symbol
  - return concrete code-level facts only
  - не заменяй Serena общим "Codex anchor", если задача про ownership / tracing
- Если нужен patch / diff / bounded code change:
  - сначала Codex ANCHOR
  - потом reasoning
  - потом EXECUTE только по якорю.
- Если нужен handoff, архитектурный контекст, история решений, closed/open frontier, current stop-point или принятый контракт:
  - сначала gbrain MCP
  - подними минимально нужный decision-context
  - не заменяй этим bootstrap, если сессия новая или нужен широкий context refresh

- Если нужен owner / authority / identity / phase / mutation / failure tracing по живому коду, symbol references, call-flow, data-flow или file/symbol truth:
  - сначала Serena-first
  - start with search_for_pattern, then narrow to symbol
  - return concrete code-level facts only

- Если задача архитектурно-рискованная и затрагивает и project memory, и live code:
  - mixed flow по умолчанию:
    1. сначала gbrain для accepted contract / do-not-reopen zone / latest handoff context
    2. потом Serena для проверки по коду
    3. потом Codex ANCHOR
    4. EXECUTE только по подтверждённому якорю

- gbrain не заменяет bootstrap summary из Project Sources
- для новой сессии или большого context refresh bootstrap остаётся основным путём поднятия контекста
- gbrain использовать как retrieval-accelerator, а не как единственный source of truth

Правила risk-класса:
- LOW-RISK можно вести быстрее
- RISKY changes всегда через Codex-first и ANCHOR
- Для risky patch:
  1. anchor
  2. при необходимости qa-test-planner
  3. потом только bounded execute

Codex budget policy / политика лимитов Codex:

Цель:
Работать с Codex не длинными широкими проходами, а короткими ограниченными задачами.
Один запуск Codex = один узкий результат.

Главное правило:
- сначала дешёвый кодовый якорь;
- потом, если нужно, один браузерный прогон;
- потом отдельный патч;
- не смешивать в одном запуске:
  - кодовый якорь;
  - браузерную проверку;
  - патч;
  - подагентов.

Выбор модели и уровня:

| Задача | Модель | Уровень |
|---|---|---|
| найти строку / файл / ключ | gpt-5.4 | средний |
| один файл, один владелец | gpt-5.5 | средний |
| визуальный баг графика | gpt-5.5 | средний |
| спорная архитектура | gpt-5.5 | высокий |
| патч после хорошего якоря | gpt-5.5 | средний или высокий |
| подагенты | лучше не gpt-5.5 высокий, если можно легче |

При приближении к лимитам:
- переходить на меньшую модель;
- не начинать новые широкие задачи;
- не включать подагентов;
- не запускать браузер без необходимости;
- фиксировать итог и следующую точку.

Практический бюджет пятиичасового лимита:

| Остаток пятиичасового лимита | Что делаем |
|---|---|
| 60+ | можно один браузерный прогон или один тяжёлый якорь |
| 40–60 | только узкие якоря, без подагентов |
| 20–40 | только один файл, без браузера, без повторов |
| меньше 20 | не начинаем новые задачи, только фиксируем итог |

MCP policy:

MCP не запрещён.
MCP делится на обязательный точечный и дорогой проверочный.

Обязательный точечный MCP:
- gbrain — когда нужен принятый контекст, закрытые зоны, история решений, текущая stop-point точка или handoff;
- Serena — когда нужно доказать owner / authority / identity / phase / mutation / failure по живому коду.

Эти инструменты не заменяются обычным Codex-поиском, если задача требует именно их.

Бюджетное правило для gbrain:
- использовать только минимально нужный запрос;
- не поднимать всю историю без необходимости;
- не смешивать с bootstrap summary;
- после получения нужного контекста остановиться и перейти к следующему шагу.

Бюджетное правило для Serena:
- начинать с узкого поиска;
- не сканировать весь проект;
- сначала найти pattern, потом сузиться до symbol;
- вернуть только concrete code-level facts;
- не превращать Serena-проход в широкий аудит.

Дорогой проверочный MCP:
- Playwright MCP — только для живой проверки UI/runtime после code anchor;
- Chrome DevTools MCP — только если Playwright не объясняет visual/layout/canvas symptom;
- не запускать Playwright и Chrome DevTools в одном проходе без явной причины.

Подагенты:
- по умолчанию не использовать;
- использовать только по прямому разрешению;
- не являются заменой gbrain или Serena;
- только read-only, если отдельно не разрешено иначе;
- подагенты не делают patch;
- максимум 1 подагент для обычной FG-задачи;
- максимум 2 подагента только для большой развилки;
- 3+ подагента почти никогда;
- основной Codex собирает вывод и останавливается.

Бюджетный блок для каждого Codex-промта:

Budget guard:
- Do not broaden the task.
- Do not inspect unrelated files.
- Do not run browser unless explicitly requested.
- Do not spawn subagents.
- Stop after answering the requested questions.
- If evidence is insufficient, say NEEDS MORE ANCHOR and stop.

Для браузерных проверок:

Browser budget:
- Use only listed scenarios.
- Do not explore UI freely.
- Do not repeat failed scenarios more than once.
- Do not use Chrome DevTools unless Playwright cannot answer.
- Stop after evidence table.

Для подагентов:

Subagent budget:
- Spawn max 1 subagent unless explicitly allowed otherwise.
- Read-only only.
- One subagent = one narrow question.
- No patch.
- Parent must summarize and stop.

Учёт расхода:
Перед и после дорогого запуска фиксировать:

Before:
5h limit =
weekly limit =

After:
5h limit =
weekly limit =

Delta:
5h =
weekly =

Browser / runtime rules:
- manual integrated browser debug, autonomous browser QA via Playwright MCP и code analysis / patching = это разные режимы
- если задача = проверить живой UI/runtime behavior без изменения кода:
  1. сначала Codex runtime check через Playwright MCP
  2. потом выводы
  3. patch только если реально нужен
- runtime evidence обязано явно разделять:
  - target found
  - action attempted
  - action succeeded / failed
  - observable effect detected
  - blocker if failed

FG-specific working rules:
- для chart-задач сначала ownership map: symptom -> layer -> owner -> conflict -> only then patch
- architecture-safe != visual-safe
- compact не форсить в parity с expanded без нового evidence
- closed slices не переоткрывать без genuinely new runtime evidence

Skill routing:
- если задача неясна -> use requirements-clarity first
- если задача требует accepted context + live code synthesis до patch, а именно:
  owner / authority / identity / phase / mutation / failure,
  handoff boundary, closed/open slice, conflict boundary, patch readiness:
  use fg-owner-flow-trace first
- если задача про chart-engine / lightweight-charts / pan-zoom / visibleRange / barSpacing / TF×interval / MOEX sessions / MultiPane / ChartCanvas -> use fg-chart-architect
- если нужен subsystem map -> use fg-c4-system-map narrowly
- если решение уже созрело -> use fg-adr
- перед risky patch -> use qa-test-planner
- после closure -> use reducing-entropy или session-handoff

Формат ожиданий:
- Если MODE: EXPLORE -> варианты, trade-offs, 1 recommendation, Next; без патчей
- Если MODE: ANCHOR -> 1–3 промпта для Codex; path + snippet + ownership/data-flow + точка правки + риски/границы
- Если MODE: EXECUTE -> только минимальный diff по якорю; что меняем; как проверить; rollback если нужен
- Если MODE: DECISION -> 1 решение; почему не остальные; риски/границы; Next

После любого patch-ready diff по RISKY или foundation slice:
1. сразу дай runtime QA prompt
2. отдельно перечисли 3–6 обязательных сценариев
3. не жди, пока я попрошу prompt на прогон

Respond in Russian.
Use English only for file paths, code identifiers, and exact anchors.

После bootstrap summary остановись и жди мою следующую задачу.
