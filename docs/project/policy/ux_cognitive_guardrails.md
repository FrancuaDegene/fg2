# FG UX Cognitive Guardrails v1.2

**Статус:** working policy
**Роль:** conditional UX decision filter для Codex
**Основание:** FG DNA
**Канонический путь:** `docs/project/policy/ux_cognitive_guardrails.md`

---

## 1. Authority boundary

FG DNA определяет, **почему** FG защищает самостоятельность мышления инвестора.

Этот policy определяет, **какие когнитивные риски проверить перед новым UX-решением**.

> **FG использует знание о когнитивных искажениях для защиты решения пользователя, а не для управления им.**

Этот файл:

- не заменяет FG DNA;
- не заменяет `AGENTS.md`, `CODEX_RULES.md` и execution policies;
- не определяет MODE;
- не заменяет accepted product/UX contracts;
- не задаёт общий runtime QA;
- не является layout contract конкретного компонента.

При конфликте с accepted contract Codex не переопределяет контракт самостоятельно. Он фиксирует `authority gap` и останавливается до решения owner.

---

## 2. Activation boundary

Прочитать policy **до принятия решения**, если задача может изменить то, что пользователь:

- заметит первым;
- поймёт;
- сочтёт важным или достоверным;
- воспримет как рекомендацию;
- почувствует обязанным сделать.

Типовые triggers:

- hierarchy, placement, ordering, visibility, emphasis;
- wording и color meaning;
- defaults, sorting, filtering;
- interaction и confirmation logic;
- loading, empty, stale, partial, error и recovery states;
- notifications;
- AI output, signals и indicators;
- скрытие, сворачивание или отложенный показ данных.

Не читать policy для:

- refactor без user-facing эффекта;
- dependency update;
- identifier rename;
- formatting-only работы;
- backend-only задачи без влияния на UX;
- точной механической реализации уже утверждённого bounded contract.

Если mechanical task раскрывает новую UX-неопределённость:

1. остановиться до принятия решения;
2. прочитать этот policy;
3. прочитать relevant contract;
4. зафиксировать `authority gap`, если решение всё ещё не определено.

---

## 3. Cognitive review method

Для одной задачи выбрать максимум **2–4 релевантных bias**.

1. Определить `object`, `layer`, `phase` и user task.
2. Проверить `owner`, `authority`, `identity`.
3. Найти `primary anchor`.
4. Определить скрытый или ослабленный context.
5. Выбрать релевантные bias.
6. Для каждого сформулировать конкретный risk и guardrail.
7. Разделить `fact / assumption / needs verification`.
8. Принять минимальное обратимое решение или зафиксировать `authority gap`.

Правильная цепочка:

```text
observable UX condition
→ cognitive risk
→ testable hypothesis
→ guardrail
→ evidence
→ decision
```

Когнитивное искажение не является диагнозом, доказательством причинности или самостоятельным основанием для redesign.

Если evidence недостаточно:

> Это UX-гипотеза, а не установленное пользовательское поведение.

---

## 4. Selection index

Использовать индекс только для выбора 2–4 релевантных проверок.

| Тип решения | Сначала проверить |
|---|---|
| Первый акцент, порядок, hierarchy | Anchoring, Position, Information overload |
| Wording, color, comparison | Framing, Context, Loss aversion |
| News и narratives | Availability, Confirmation, Illusory truth |
| Defaults и preselected states | Anchoring, Status quo/default, Automation |
| Branding и system authority | Familiarity, Authority, Automation |
| AI, signals, indicators | Authority, Automation, Action bias |
| Errors, warnings, recovery | Framing, Loss aversion, Peak-end |
| CTA и pressure to act | Loss aversion, Authority, Action bias |

Индекс не заменяет анализ конкретного object и phase.

---

# 5. Reference guardrail catalog

## 5.1. Anchoring bias — эффект привязки

- **Risk:** цена, дневное изменение, первый result, default timeframe или первая AI-фраза получают чрезмерный вес.
- **Guardrail:** показывать period, range, context и freshness; делать defaults видимыми и обратимыми; не позволять одному элементу подменять вывод.
- **Do not infer:** больше кликов по первому элементу не доказывает anchoring без проверки relevance, placement и interaction cost.

## 5.2. Framing effect — эффект формулировки

- **Risk:** wording, color или comparison незаметно превращают факт в bullish/bearish narrative либо создают urgency.
- **Guardrail:** сначала факт, затем interpretation; явно указывать period и benchmark; не использовать скрытую buy/sell семантику.
- **Do not infer:** формулировка не считается нейтральной без проверки её влияния на urgency, certainty и actionability.

## 5.3. Availability heuristic — эвристика доступности

- **Risk:** одна яркая или свежая новость становится полным объяснением движения цены.
- **Guardrail:** показывать time, source, relevance и independent confirmation; отделять recency от significance.
- **Do not infer:** временная близость новости и движения цены не доказывает causality.

## 5.4. Confirmation bias — ошибка подтверждения

- **Risk:** feed, signal или AI-summary превращается в одностороннее подтверждение исходного тезиса.
- **Guardrail:** сохранять materially conflicting evidence, uncertainty и missing data; не путать preference с objective relevance.
- **Do not infer:** повторный просмотр инструмента не доказывает, что пользователю нужны только подтверждающие данные.

## 5.5. Loss aversion — неприятие потерь

- **Risk:** red states, alerts и volatility усиливают страх и pressure to act.
- **Guardrail:** контролировать color intensity; показывать period и range; отделять price movement от recommendation; не превращать volatility в engagement mechanic.
- **Do not infer:** сильная эмоция не означает, что интерфейсу нужно больше emphasis.

## 5.6. Familiarity effect — эффект знакомства

- **Risk:** logo или известность эмитента получают больше authority, чем данные.
- **Guardrail:** сохранять нейтральную identity; явно показывать ticker, class, board, currency и source; ранжировать по explainable relevance.
- **Do not infer:** высокий engagement известного эмитента не доказывает лучшую usability.

## 5.7. Position effect — эффект позиции

- **Risk:** первая новость, metric или search result воспринимается как самый важный.
- **Guardrail:** ordering должен иметь явную authority: chronology, relevance, source quality или user choice.
- **Do not infer:** первая позиция не равна максимальной важности без explicit contract.

## 5.8. Context effect — эффект контекста

- **Risk:** price change, volume, yield или indicator показываются в semantic isolation.
- **Guardrail:** давать минимально достаточный context; отделять technical identifiers от user-facing meaning; избегать fake precision.
- **Do not infer:** знакомый числовой формат не делает значение самоочевидным.

## 5.9. Illusory truth effect — иллюзия правды

- **Risk:** reposts, duplicated headlines или repeated AI wording выглядят как независимое подтверждение.
- **Guardrail:** deduplication, primary source, first publication time и distinction между repost count и independent confirmation.
- **Do not infer:** количество публикаций не является proxy для truth или significance.

## 5.10. Authority bias — эффект авторитета

- **Risk:** AI-summary, indicator, badge или large card воспринимаются как готовая рекомендация.
- **Guardrail:** показывать source, method и confidence boundary; различать factual, calculated и inferred data; избегать imperative language.
- **Do not infer:** технический или automatic output не получает доверие автоматически.

## 5.11. Automation bias — чрезмерное доверие автоматике

- **Risk:** stale, partial, cached или inferred output получает system authority.
- **Guardrail:** показывать freshness, calculation type и fallback state; сохранять доступ к evidence; не вести напрямую к high-impact action.
- **Do not infer:** принятие автоматического результата не доказывает его correctness или usability.

## 5.12. Information overload — информационная перегрузка

- **Risk:** workspace превращается в стену равноправных карточек, а primary evidence теряет иерархию.
- **Guardrail:** разделять identity, evidence, primary metrics и secondary context; использовать progressive disclosure без скрытия critical data.
- **Do not infer:** меньше элементов не всегда означает лучшее понимание.

## 5.13. Status quo/default effect — эффект default

- **Risk:** timeframe, sorting или indicator default принимается за объективно правильный.
- **Guardrail:** default должен быть видимым, нейтральным, объяснимым и легко обратимым.
- **Do not infer:** сохранение default не доказывает его optimality.

## 5.14. Peak-end rule — правило пика и конца

- **Risk:** error, warning или неясный final state определяют восприятие всей сессии.
- **Guardrail:** проектировать recovery, сохранять context после retry, объяснять, что произошло, и обеспечивать спокойный end state.
- **Do not infer:** happy path не является достаточной проверкой flow.

## 5.15. Action bias — склонность действовать

- **Risk:** signal или AI-summary заканчивается transaction pressure или `act now` semantics.
- **Guardrail:** сохранять пути `inspect`, `compare`, `save`, `return later`; позволять завершить анализ без рыночного действия.
- **Do not infer:** отсутствие действия не является провалом, если цель FG — понимание.

---

## 6. Surface map

| Surface | Основные checks |
|---|---|
| `SearchForm` / suggestions | position, familiarity, identity, metadata sufficiency |
| `CompanyInfo` | primary anchor, truthful field meaning, fallback visibility, branding authority |
| `Price` | period, freshness, range, color pressure, context |
| `Chart Evidence` | default timeframe, scale, indicator authority, raw vs calculated data |
| `News` | deduplication, primary source, chronology, independent confirmation |
| `Signals` | source, method, freshness, confidence, evidence, no buy/sell pressure |
| `AI summaries` | sources, uncertainty, contradictory evidence, generated vs factual content |

Эта карта помогает выбрать bias, но не заменяет component contract.

---

## 7. Evidence and inference boundary

Сильные evidence:

- current runtime behavior;
- repository implementation;
- explicit product/UX contract;
- analytics;
- user testing;
- support cases;
- repeated observable pattern;
- verified domain constraint.

Слабые evidence:

- один reference screenshot;
- generic best practice;
- aesthetic preference;
- единичный anecdote;
- AI-generated rationale;
- предположение о психологии пользователя.

Codex не должен:

- диагностировать bias по одному действию;
- выдавать correlation за causality;
- использовать название bias как достаточное обоснование;
- переопределять accepted contract без owner decision;
- скрывать отсутствие evidence уверенной формулировкой.

Этот policy не задаёт отдельный runtime workflow. Runtime используется только как evidence в рамках существующих execution policies.

---

## 8. Dark-pattern boundary

FG не использует cognitive effects, чтобы:

- создавать artificial urgency;
- скрывать option или усложнять отказ;
- усиливать anxiety ради engagement;
- раздувать authority AI;
- скрывать uncertainty;
- использовать defaults против интересов пользователя;
- выдавать repetition за confirmation;
- превращать analysis в transaction pressure.

Любое решение, которое повышает conversion ценой cognitive autonomy, противоречит FG DNA.

---

## 9. Compact output contract

Использовать только когда policy активирован и задача требует нового UX-решения:

```md
## UX Cognitive Check

Object / phase:
User task:
Authority / primary anchor:

Relevant biases:
1.
2.

Risks:
- ...

Guardrails:
- ...

Evidence:
- Fact:
- Assumption:
- Needs verification:

Decision or authority gap:
- ...
```

Не выводить этот блок для mechanical implementation без нового UX-решения.

---

## 10. Acceptance check

Перед принятием решения проверить:

1. Что пользователь пытается понять?
2. Что он увидит первым и почему?
3. Что выглядит наиболее авторитетным?
4. Какой context или uncertainty скрыт?
5. Не воспринимается ли default, AI output или signal как recommendation?
6. Не создают ли wording, color или ordering лишнюю urgency?
7. Может ли пользователь проверить вывод и безопасно ничего не делать?
8. Есть ли достаточное evidence либо это только гипотеза?

Каноническое правило:

> Предпочесть решение, которое помогает понять и проверить, даже если оно создаёт меньше urgency, меньше кликов или более медленное действие.
