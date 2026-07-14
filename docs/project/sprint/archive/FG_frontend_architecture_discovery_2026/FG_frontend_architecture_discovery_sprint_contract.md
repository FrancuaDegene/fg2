# FG Frontend Architecture Discovery Pass — Sprint Contract

## 1. Статус

Статус: `completed contract / final verdict accepted`

## Closure Status

This contract is now closure-aware and should not be treated as active Phase 1 entry.

Accepted completion state:

- Phase 1 completed / anchor accepted.
- Phase 2 completed / anchor accepted.
- Phase 3 completed / anchor accepted.
- Phase 4 completed / final verdict accepted.
- Product code changed: no.
- Browser / runtime QA run: no.
- Cleanup implementation started: no.
- Chart internals reopened: no.
- AI / Summary is deferred / test surface / out of current product scope.

Final outcome:

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

Preferred next-line name:

`Bounded Frontend Contract Hardening Sprint`

Accepted final contract candidates:

- Workspace / navigation contract candidate: FG remains a single analytical workspace unless a later product decision introduces route / page architecture.
- App shell contract candidate: `App.js` may coordinate workspace identity and layout state, but should not keep accumulating domain transport, cache, and failure ownership as product surfaces grow.
- Domain boundary contract candidate: frontend domains should receive stable inputs and callbacks; relay layers should not become hidden owners of domain logic.
- State ownership contract candidate: canonical ticker / result identity belongs at workspace level; domain runtime state belongs inside the relevant domain.
- API / transport contract candidate: endpoint config may stay shared, but each feature boundary needs one owner for request, loading, error, and cache behavior.
- Legacy surface contract candidate: inherited legacy surfaces are not treated as completed FG product domains without an explicit Owner decision.
- Chart product-boundary contract candidate: closed chart internals remain closed; before new chart-heavy scenarios, only the App / Chart transport ownership boundary needs hardening.
- Deferred AI / Summary contract: AI / Summary is a deferred / test surface and is out of current product scope.

Этот документ был рабочим контрактом sprint и теперь является closure-aware historical contract для завершённого Frontend Architecture Discovery Pass.

Sprint был активирован на source-routing level.

Phase 0 activation completed:

1. `FG_ACTIVE_SOURCE_PACK.md` обновлён под новый sprint;
2. создан authoritative current-state file для этого sprint;
3. подготовлена новая Codex source-chain.

Current next safe entry:

- sync current-state / source-pack after closure docs;
- create closure review and durable frontend contracts doc if approved;
- then activate `Bounded Frontend Contract Hardening Sprint`.

## 2. Название спринта

`Frontend Architecture Discovery Pass`

## 3. Назначение

Цель этого sprint — получить чистую и актуальную frontend-wide архитектурную картину FG перед следующим product/design этапом.

Это discovery sprint, а не cleanup sprint.

Sprint должен ответить, достаточно ли текущий frontend-фундамент стабилен для следующего product/design этапа, или сначала нужен отдельный bounded frontend cleanup sprint.

## 4. Главный вопрос

Достаточно ли текущий frontend-фундамент FG стабилен для следующего product/design этапа, или перед этим нужен bounded frontend cleanup sprint?

## 5. Почему этот sprint нужен

Предыдущий большой sprint стабилизировал chart-domain и закрыл его внутренние фазы.

Но это не доказывает автоматически, что весь frontend как система уже архитектурно понятен.

Этот sprint закрывает frontend-wide слепую зону между:

закрытая chart-domain stabilization
→ следующий product/design этап

Цель — не начинать следующий product/design этап вслепую.

Sprint должен дать evidence-backed frontend architecture snapshot, risk map и финальный route verdict.

## 6. Scope

В scope входит:

- `App` и верхний frontend shell;
- page-level orchestration;
- главные UI-домены;
- shared state surfaces;
- frontend data-flow boundaries;
- frontend ↔ backend integration surfaces;
- chart-domain только как один из frontend-доменов, не как центр pass;
- search / ticker / results / news / summary / shared panels;
- top-level owner surfaces;
- relay-only layers;
- accidental logic leakage между frontend-доменами;
- shared surfaces, которые могут стать рискованными при росте продукта.

## 7. Out of Scope

В scope не входит:

- product code changes;
- refactor;
- redesign;
- CSS polishing;
- backend rewrite;
- dependency updates;
- полный inventory всех frontend-файлов;
- переоткрытие закрытого chart stabilization sprint;
- переоткрытие `Task 1–5`, `Phase 6`, `Phase 7`, `Phase 8`, `9.1–9.7`;
- broad `MultiPaneChart` redesign;
- new indicators;
- multiple lower panes;
- implementation cleanup-кандидатов, найденных во время discovery.

## 8. Связь с закрытым chart sprint

Предыдущий `FG Chart Architecture Stabilization Sprint` считается закрытым background.

Закрытые chart-решения остаются закрытыми без genuinely new runtime/code evidence.

Chart-domain можно анализировать в этом sprint только как один frontend-domain внутри общей frontend-карты.

Chart docs могут использоваться как conditional domain pack, когда это нужно, но они не должны доминировать над frontend-wide discovery pass.

## 9. Архитектурная оптика

Каждую важную находку классифицировать через FG architecture lens:

object / layer
→ owner
→ authority
→ identity
→ phase
→ mutation
→ failure

Не прыгать от симптома к patch.

Для этого sprint рабочая последовательность такая:

surface
→ layer
→ owner
→ boundary
→ coupling / leakage risk
→ classification

## 10. Вопросы, на которые sprint должен ответить

Sprint должен ответить:

- Какие frontend-домены реально существуют сейчас?
- Где находятся top-level owners?
- Какие layers являются relay-only?
- Где relay-layer уже содержит accidental logic?
- Какие boundaries уже чистые?
- Какие boundaries размыты?
- Какие shared surfaces могут начать ломаться при росте продукта?
- Какие области stable enough before product/design?
- Какие области требуют bounded cleanup before product/design?
- Какие области являются later frontier / can wait?
- Какие top-level surfaces нормально принадлежат `App` как shell orchestration?
- Какие top-level surfaces слишком завязаны на `App` и могут требовать cleanup?
- Где non-chart leakage живёт между search, results, news, summary и shared panels?

## 11. Ожидаемые результаты

Sprint должен произвести три основных результата.

### 11.1 Frontend Architecture Snapshot

Компактная карта:

- главные frontend-домены;
- top-level shell;
- page-level orchestration zones;
- основные data-flow boundaries;
- integration points;
- domain ownership zones.

### 11.2 Frontend Risk Map

Компактная карта:

- stable frontend areas;
- blurred boundaries;
- accidental coupling;
- risky shared surfaces;
- possible future breakpoints under product growth.

### 11.3 Final Recommendation Block

Sprint должен завершиться одним чётким verdict:

`READY FOR NEXT PRODUCT/DESIGN PHASE`

или:

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

Если cleanup нужен, output должен назвать только bounded cleanup candidates, а не broad refactor ideas.

## 12. Финальные корзины классификации

Каждая важная область должна попасть в одну из трёх корзин:

1. `Stable enough before product/design`
2. `Needs bounded cleanup before product/design`
3. `Later frontier / can wait`

## 13. Фазы sprint

### Phase 0 — Sprint Contract / Discovery Frame

Цель:

Финально зафиксировать и активировать рамку sprint.

Вопросы:

- Что именно представляет собой этот sprint?
- Что входит в scope?
- Что не входит в scope?
- Какие artefacts должны появиться?
- Какая форма финального verdict?
- Что защищает discovery от превращения в cleanup?

Expected output:

- accepted sprint contract;
- source architecture будет обновлена отдельным activation step;
- новый current-state будет создан отдельным activation step.

DoD:

- sprint scope понятен;
- out-of-scope явно зафиксирован;
- final outputs понятны;
- product code не менялся.

### Phase 1 — Frontend System Map

Главный вопрос:

Как текущий frontend FG устроен как система?

Проверить:

- top-level frontend shell;
- main page-level orchestration zones;
- major UI domains;
- search;
- ticker;
- results;
- news;
- summary;
- shared panels;
- chart как один domain;
- frontend ↔ backend integration surfaces.

Expected output:

- Frontend architecture snapshot v1;
- список main domains;
- список top-level shell / orchestration surfaces;
- первичный список integration boundaries.

DoD:

- основные frontend-домены названы;
- top-level shell описан;
- chart включён, но не доминирует pass;
- cleanup recommendations не даются без evidence.

### Phase 2 — Ownership & Boundary Pass

Главный вопрос:

Кто чем владеет, и где ответственность начинает размываться?

Проверить:

- state owners;
- top-level owners;
- relay-only layers;
- accidental logic inside relay layers;
- `App` как normal shell orchestration vs overloaded authority surface;
- frontend ↔ backend data boundary;
- mutation ownership;
- failure ownership.

Expected output:

- ownership map;
- boundary map;
- список clean boundaries;
- список suspicious boundaries;
- список structurally risky boundaries.

DoD:

- у каждой risky finding есть owner/layer evidence;
- `App` не называется “too big” без конкретного bounded evidence;
- relay-only surfaces отделены от logic-owning surfaces.

### Phase 3 — Cross-Domain Coupling / Leakage Pass

Главный вопрос:

Где frontend-слабость живёт между доменами, а не внутри одного домена?

Проверить:

- search -> results;
- results -> summary;
- news -> shared panels;
- shared state surfaces;
- implicit dependencies;
- duplicated concepts;
- domain-to-domain data leakage;
- места, где product growth может создать breakage.

Expected output:

- frontend coupling map;
- leakage risk list;
- growth-risk notes.

DoD:

- cross-domain coupling отделён от normal orchestration;
- risks классифицированы по concrete boundary, а не по ощущению;
- broad rewrite не предлагается.

### Phase 4 — Synthesis / Verdict

Главный вопрос:

Можно ли FG идти в следующий product/design этап, или сначала нужен bounded frontend cleanup?

Произвести:

- final architecture snapshot;
- final risk map;
- final three-bucket classification;
- final recommendation.

Допустимые final verdicts:

`READY FOR NEXT PRODUCT/DESIGN PHASE`

или:

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

DoD:

- final verdict явный;
- cleanup candidates bounded;
- later frontiers отделены от blockers;
- code patch не делался как часть discovery.

## 14. Do-Not Rules

Не делать:

- patch product code во время этого sprint;
- превращать discovery в opportunistic cleanup;
- redesign frontend shell;
- ставить chart-domain в центр всего pass;
- переоткрывать закрытый chart stabilization sprint;
- трактовать archived chart sprint docs как active authority;
- создавать broad refactor proposals без bounded evidence;
- называть `App` overloaded без точного ownership / mutation / failure risk;
- считать relay layer плохим только потому, что он передаёт много props;
- путать normal shell orchestration с accidental logic leakage;
- запускать browser QA без конкретной необходимости в одной из фаз;
- использовать history/archive файлы как более сильную authority, чем active source pack и active current-state.

## 15. Codex Routing Rules for This Sprint

Default Codex mode для этого sprint:

`read-only evidence pass`

Для Phase 1:

- bounded read-only prompt;
- inspect top-level frontend shell and main UI domains;
- no patch;
- no cleanup plan yet;
- return concrete files and observed roles.

Для Phase 2:

- ownership / boundary pass;
- identify owner, authority, identity, mutation, failure surfaces;
- return evidence-backed classifications.

Для Phase 3:

- cross-domain coupling / leakage pass;
- focus on boundaries between domains;
- avoid full repository inventory.

Для Phase 4:

- synthesize only from gathered evidence;
- classify into three buckets;
- produce one final verdict.

Subagents:

- not default;
- allowed only if Codex routing justifies genuinely independent read-only evidence lanes;
- no patch ownership;
- parent Codex must synthesize.

Browser:

- not default for discovery;
- use only if a specific UI/runtime claim must be verified;
- do not run browser freely.

## 16. Source Routing Expectations

Expected source order после sprint activation:

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_frontend_architecture_discovery_current_state_2026-05-25.md`
5. `docs/project/sprint/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_sprint_contract.md`
6. `docs/project/sprint/FG_frontend_architecture_discovery_2026/phase_0_sprint_activation_checklist.md`
7. `docs/project/sprint/FG_frontend_architecture_discovery_2026/phase_1_frontend_system_map.md`
8. `.claude/handoffs/README.md`
9. `.claude/handoffs/active/FG_frontend_architecture_discovery_2026/`
10. relevant domain pack only when needed
11. closed chart sprint closure / retrospective only as background
12. `gbrain` only as helper, not authority replacement

## 17. Success Criteria

Sprint успешен, если:

- frontend domains стали видимыми;
- top-level owners понятны;
- stable zones определены;
- weak boundaries определены;
- cleanup need решён, а не угадан;
- следующий product/design этап больше не начинается вслепую;
- required cleanup, если он нужен, ограничен concrete surfaces;
- later frontiers отделены от blockers.

## 18. Non-Goals

Этот sprint не пытается сделать frontend идеальным.

Он не пытается устранить всю связность.

Он не пытается переписать `App`.

Он не пытается унифицировать всю frontend-архитектуру за один pass.

Он только решает, достаточно ли frontend foundation понятен и стабилен для следующего product/design этапа, или сначала нужен bounded cleanup.

## 19. Рабочая формула

Frontend Architecture Discovery Pass
=
map the system
→ identify owners
→ classify boundaries
→ find cross-domain leakage
→ decide next route

not:

refactor
→ polish
→ rewrite
→ patch while discovering

## 20. Итоговая формула

Этот sprint закрывает архитектурную слепую зону после завершённого chart-domain stabilization sprint.

Он должен дать:

- frontend-wide architecture snapshot;
- frontend risk map;
- решение:

`go to product/design`

или:

`run bounded frontend cleanup first`

Это решение и есть главный deliverable sprint.
