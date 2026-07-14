# Agent Subagent Routing

## Purpose

Этот файл является нормативным расширением root-contracts FG для:
- допуска `solo` / `subagents`;
- discovery-first routing;
- разбиения задачи на evidence lanes;
- выбора минимального числа workers;
- границ ролей parent / worker;
- guardrails для runtime delegation.

Этот файл:
- не заменяет `AGENTS.md`;
- не заменяет `CODEX_RULES.md`;
- не override `docs/project/policy/agent_execution_contract.md`;
- определяет routing policy, а execution hard gates остаются в execution contract.

## Core Principle

- one connected owner-flow -> `solo`;
- multiple genuinely independent evidence lanes -> `subagents`;
- выбирать минимально достаточное число workers;
- не parallelize overlap.

## Discovery-First Routing

Перед выбором `solo` или `subagents` Codex может выполнить короткий bounded discovery pass, чтобы определить реальную форму задачи.

Если discovery показывает:
- один connected trace;
- один bounded owner-flow;
- один synthesis path;

нужно выбрать `solo`.

Если discovery показывает:
- две или более materially independent truth-lanes;
- lanes, которые могут вернуть bounded, non-overlapping evidence packages;
- comparative или genuinely multi-lane decision structure;

можно рассматривать `subagents`.

Не выбирать `subagents` только потому что:
- задача выглядит большой;
- тема важная;
- "more workers" кажется более thorough;
- prompt длинный.

## When to Choose SOLO

Использовать `solo`, когда:
- есть один connected owner-flow;
- задача идёт по одной цепочке, например:
  `authority -> owner -> handoff -> consumer -> decision`;
- relevant evidence сходится в одних и тех же файлах или на одной boundary;
- parent всё равно пришлось бы заново читать и синтезировать почти всё;
- runtime probe не нужен или лучше выполняется parent-side после synthesis;
- subagents в основном дублировали бы друг друга.

## When to Choose SUBAGENTS

Использовать `subagents` только когда discovery показывает 2+ genuinely independent evidence lanes.

Примеры valid lanes:
- separate competing frontier candidates;
- accepted contract / authority package;
- UI / state path;
- renderer path;
- mutation reachability;
- downstream impact;
- independent decision packages, которые parent может сравнить в synthesis.

Это примеры, а не обязательный checklist.
Lanes должны выводиться из фактической задачи.
Owner не обязан заранее называть lanes.
Наличие нескольких секций в prompt не означает автоматического justification для `subagents`.

## Minimal Sufficient Count

Codex должен автономно выбирать worker count из числа genuinely independent lanes.

Rules:
- worker count должен быть minimal и evidence-driven;
- меньше workers допустимо только если lanes не являются truly separable;
- больше workers запрещено, если это создаёт artificial fragmentation;
- parent synthesis не является дополнительной lane.

Concise heuristics:
- `2-3` workers = normal bounded multi-lane pass;
- `4-5` workers = only when lanes are clearly distinct and decision-relevant;
- `6+` workers = special orchestration / experiment mode, not default FG work.

Не spawn workers "for confidence" или "for completeness", если структура задачи этого не оправдывает.

## Parent vs Worker Roles

Parent Codex:
- принимает routing decision;
- определяет worker lanes;
- остаётся synthesis owner;
- сравнивает evidence packages;
- решает, нужен ли runtime probe;
- владеет final implementation recommendation;
- владеет patch readiness и patch direction.

Workers:
- возвращают только bounded evidence;
- не расширяют scope;
- не заменяют parent synthesis;
- не принимают final architectural decision вместо parent;
- не override Project Sources или accepted boundaries;
- остаются внутри назначенной evidence lane.

## Patch Ownership

Code mutation must not be delegated to subagents under the current/default FG policy.

Any future worker-execution mode would require a separate explicit policy update and Owner approval before it can be treated as allowed FG workflow.

Subagents may return:
- likely target;
- patch-readiness input;
- evidence gap;
- risk classification;
- boundary caveat.

Final patch decision и code mutation ownership остаются у parent Codex.

## Parent Synthesis Rule

Parent должен synthesize worker outputs, а не redo full analysis.

Если parent должен существенно заново читать тот же материал, чтобы прийти к final verdict, исходная subagent decomposition, вероятно, была unjustified, overlapping или плохо bounded.

Parent synthesis should:
- сравнивать evidence packages;
- разрешать lane-level tension;
- выдавать одну bounded recommendation;
- не re-run путь каждого worker с нуля.

## Runtime / Browser Rule

Delegated browser QA не является default FG workflow.

Она допустима только если worker-side browser access доказан в том же run.

Если parent имеет доступ к `iab`, но spawned worker не имеет, нужно явно классифицировать это как:

`worker-browser-lane mismatch`

Пока worker browser lane не доказан как stable:
- subagents могут собирать code/docs evidence;
- parent Codex сам выполняет runtime / browser QA, когда это нужно.

Не интерпретировать worker browser-lane failure как FG product failure.

## Worker Session Hygiene

Если используются `subagents`, worker sessions должны обрабатываться осознанно.

Если Owner просит оставить workers open for review, не закрывать их.

В остальных случаях close или keep worker sessions open нужно осознанно, согласно task constraints и environment limits, и reporting этого выбора должен быть в final synthesis.

Если environment limits блокируют spawning новых workers, older completed worker sessions можно clean up только когда task это допускает, и cleanup должен быть reported explicitly.

## Required Reporting After Routing

Final synthesis должен report:
- chosen mode:
  - `solo`
  - `subagents`

Если использовались `subagents`:
- autonomously derived evidence lanes;
- chosen worker count;
- почему это число было minimal;
- worker model request, если был;
- было ли actual worker model application verifiable;
- worker sessions были left open или closed.

Также report:
- был ли routing decision justified in retrospect;
- был ли runtime probe needed;
- кто выполнял runtime, если он использовался:
  - parent
  - worker
  - blocked by environment;
- была ли browser limitation классифицирована как:
  `worker-browser-lane mismatch`.

## Anti-Patterns

Не допускается:
- spawning workers "for thoroughness";
- использовать `subagents` для одного connected owner-flow;
- splitting one trace into fake lanes;
- workers reading the same files for the same conclusion;
- parent redoing the whole worker analysis;
- delegating patch ownership to workers;
- использовать `subagents` для bypass authoritative Project Sources;
- treating browser worker failure as FG product failure, когда это фактически `worker-browser-lane mismatch`.

## Final Summary

- one owner-flow -> `solo`
- independent truth-lanes -> minimal `subagents`
- parent synthesizes and owns patch
- unproven worker browser lane -> parent runtime QA
