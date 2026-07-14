# Phase 2 — Search Suggestions Single Owner Contract

## Статус

`completed / patch + runtime QA accepted`

## Назначение

Зафиксировать результат первого real hardening patch в sprint.

Цель Phase 2: убрать duplicated transport ownership у Search suggestions без Search UX redesign.

## Исходная проблема

До patch `SearchForm.js` сам владел:

- прямым suggestions request;
- debounce / fetch behavior;
- local suggestions state;
- error clearing behavior.

При этом `SearchModal` уже использовал `useSearch.js`.

Это создавало двух frontend-владельцев одного feature concern:

`Search suggestions`.

## Принятое решение по владельцу

После patch:

- `useSearch.js` является canonical owner для Search suggestions request / result behavior.
- `SearchForm.js` не является transport owner.
- `SearchForm.js` остается UI wrapper.
- `SearchModal.js` не менялся и продолжает использовать `useSearch.js`.

## Измененные файлы

Product code changed: yes.

Измененный файл:

- `fingineerwebapp/src/components/SearchForm.js`

Не менялись:

- `fingineerwebapp/src/hooks/useSearch.js`
- `fingineerwebapp/src/components/SearchModal/SearchModal.js`
- `fingineerwebapp/src/config/api.js`
- `fingineerwebapp/src/App.js`

## Сводка patch

Зафиксировано:

- removed direct `axios` suggestions transport ownership from `SearchForm.js`;
- removed duplicated local suggestions fetch path;
- removed local suggestions state ownership;
- connected `SearchForm.js` to shared `useSearch`;
- preserved current visible SearchForm behavior;
- preserved SearchModal behavior.

## Runtime QA

Runtime QA method:

`browse use`

Runtime QA verdict:

`BROWSE USE QA PASS — SEARCH PATCH CAN BE DOC-SYNCED`

Подтверждено:

- `gaz` suggestions visible;
- visible suggestions included `GAZAP`, `GAZC`, `GAZP`, `GAZS`;
- click on suggestion worked;
- input became `GAZAP`;
- manual submit with `sber` worked;
- clear button worked;
- UI did not crash.

Не проверялось:

- chart;
- News;
- Dashboard;
- SearchModal deep QA, unless already confirmed elsewhere.

## Заметка по инструменту QA

`browse use` DOM snapshot may miss transient overlay suggestions.

Принятая интерпретация:

- если screenshot / visual observation показывает suggestions, но DOM snapshot их пропускает, это snapshot / visibility limitation, а не product failure.
- не отмечать Search suggestions как FAIL только из-за отсутствующих overlay rows в `dom_cua.get_visible_dom()`.

## Результат контракта

`SearchForm.js` перестал быть отдельным suggestions transport owner.

Search suggestions теперь имеют одного frontend owner через shared Search boundary / hook.

## Сохраненные non-goals

- no Search UX redesign;
- no new Search features;
- no endpoint change;
- no backend change;
- no `App.js` change;
- no `SearchModal` rewrite;
- no chart work;
- no News work;
- no Dashboard work.

## Следующий безопасный вход

`Phase 3 — App <-> Chart Transport / Domain Contract`
