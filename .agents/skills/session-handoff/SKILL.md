---
name: session-handoff
description: "Creates comprehensive handoff documents for seamless AI agent session transfers. Triggered when: (1) user requests handoff/memory/context save, (2) context window approaches capacity, (3) major task milestone completed, (4) work session ending, (5) user says 'save state', 'create handoff', 'I need to pause', 'context is getting full', (6) resuming work with 'load handoff', 'resume from', 'continue where we left off'. Proactively suggests handoffs after substantial work (multiple file edits, complex debugging, architecture decisions). Solves long-running agent context exhaustion by enabling fresh agents to continue with zero ambiguity."
---

# Handoff

Creates comprehensive handoff documents that enable fresh AI agents to seamlessly continue work with zero ambiguity. Solves the long-running agent context exhaustion problem.

## Mode Selection

Determine which mode applies:

**Creating a handoff?** User wants to save current state, pause work, or context is getting full.
- Follow: CREATE Workflow below

**Resuming from a handoff?** User wants to continue previous work, load context, or mentions an existing handoff.
- Follow: RESUME Workflow below

**Proactive suggestion?** After substantial work (5+ file edits, complex debugging, major decisions), suggest:
> "We've made significant progress. Consider creating a handoff document to preserve this context for future sessions. Say 'create handoff' when ready."

## FG Authority Guard

For FG work, current-state is authoritative for stop-point and what-next-now.
Handoffs are supporting evidence only; they preserve context but cannot override Project Sources.
Do not reopen closed zones from a handoff alone.

When resuming, first check Project Sources:
- `docs/project/state/FG_sources_ready_current_state_2026-04-04.md`
- stable architecture docs in `docs/domain/`
- the sprint file for roadmap / phase tracking only

Do not mix bootstrap summary with MCP smoke-test, runtime/browser checks, Codex prompts, or follow-up orchestration.
After bootstrap summary, stop and wait for the next explicit user task.

## CREATE Workflow

### Step 1: Generate Scaffold

Run the smart scaffold script to create a pre-filled handoff document:

```bash
python .agents/skills/session-handoff/scripts/create_handoff.py [task-slug]
```

Example: `python .agents/skills/session-handoff/scripts/create_handoff.py implementing-user-auth`

**For continuation handoffs** (linking to previous work):
```bash
python .agents/skills/session-handoff/scripts/create_handoff.py "auth-part-2" --continues-from 2024-01-15-auth.md
```

The script will:
- Create `.claude/handoffs/` directory if needed
- Generate timestamped filename
- Pre-fill: timestamp, project path, git branch, recent commits, modified files
- Add handoff chain links if continuing from previous
- Output file path for editing

### Step 2: Complete the Handoff Document

Open the generated file and fill in all `[TODO: ...]` sections. Prioritize these sections:

1. **Current State Summary** - What's happening right now
2. **Important Context** - Critical info the next agent MUST know
3. **Immediate Next Steps** - Candidate next safe step only if consistent with current-state
4. **Decisions Made** - Choices with rationale (not just outcomes)
5. **Open Questions** - Unresolved questions or evidence gaps

Use the template structure in [references/handoff-template.md](references/handoff-template.md) for guidance.
Record the current stop-point as observed from Project Sources, not as authority from the handoff itself.

### Step 3: Validate the Handoff

Run the validation script to check completeness and security:

```bash
python .agents/skills/session-handoff/scripts/validate_handoff.py <handoff-file>
```

The validator checks:
- [ ] No `[TODO: ...]` placeholders remaining
- [ ] Required sections present and populated
- [ ] No potential secrets detected (API keys, passwords, tokens)
- [ ] Referenced files exist
- [ ] Quality score (0-100)

**Do not finalize a handoff with secrets detected or score below 70.**

### Step 4: Confirm Handoff


After completing the handoff, the agent must check whether this session changed architecture
and therefore requires updating the chart engine playbook.

Ask explicitly:

"Does this session require updating docs/domain/FG_CHART_ENGINE_PLAYBOOK.md?"

Answer YES if the session introduced changes to:

- chart engine architecture layers
- ownership boundaries (data/nav/render responsibilities)
- observability mechanisms (debug panels, diagnostics)
- safety mechanisms (init recovery, guards)
- transition behaviour of the chart engine
- debugging workflow changes

Answer NO if the session only included:

- localized bug fixes
- UI tweaks
- styling changes
- performance tuning without lifecycle changes

Report to user:
- Handoff file location
- Validation score and any warnings
- Summary of captured context
- First action item for next session

## RESUME Workflow

### Step 1: Restore Project Sources

Before loading a handoff, read the FG current-state file and relevant stable docs.
Use the handoff only as supporting evidence after Project Sources are checked.

### Step 2: Find Available Handoffs

List handoffs in the current project:

```bash
python .agents/skills/session-handoff/scripts/list_handoffs.py
```

This shows all handoffs with dates, titles, and completion status.

### Step 3: Check Staleness

Before loading, check how current the handoff is:

```bash
python .agents/skills/session-handoff/scripts/check_staleness.py <handoff-file>
```

Staleness levels:
- **FRESH**: Safe to resume - minimal changes since handoff
- **SLIGHTLY_STALE**: Review changes, then resume
- **STALE**: Verify context carefully before resuming
- **VERY_STALE**: Consider creating a fresh handoff

The script checks:
- Time since handoff was created
- Git commits since handoff
- Files changed since handoff
- Branch divergence
- Missing referenced files

### Step 4: Load the Handoff

After Project Sources are checked, read the relevant handoff document completely before taking resume-specific action.

If handoff is part of a chain (has "Continues from" link), also read the linked previous handoff for full context.

### Step 5: Verify Context

Follow the checklist in [references/resume-checklist.md](references/resume-checklist.md):

1. Verify project directory and git branch match
2. Check if blockers have been resolved
3. Validate assumptions still hold
4. Review modified files for conflicts
5. Check environment state

### Step 6: Begin Work

Treat "Immediate Next Steps" from the handoff as a candidate only.
Begin with it only if it matches current-state and stable-doc evidence.

Reference these sections as you work:
- "Critical Files" for important locations
- "Key Patterns Discovered" for conventions to follow
- "Potential Gotchas" to avoid known issues

### Step 7: Update or Chain Handoffs

As you work:
- Mark completed items in "Pending Work"
- Add new discoveries to relevant sections
- For long sessions: create a new handoff with `--continues-from` to chain them

## Handoff Chaining

For long-running projects, chain handoffs together to maintain context lineage:

```
handoff-1.md (initial work)
    ↓
handoff-2.md --continues-from handoff-1.md
    ↓
handoff-3.md --continues-from handoff-2.md
```

Each handoff in the chain:
- Links to its predecessor
- Can mark older handoffs as superseded
- Provides context breadcrumbs for new agents

When resuming from a chain, read the most recent handoff first, then reference predecessors as needed.

## Storage Location

Handoffs are stored in: `.claude/handoffs/`

Naming convention: `YYYY-MM-DD-HHMMSS-[slug].md`

Example: `2024-01-15-143022-implementing-auth.md`

## Resources

### Skill-relative scripts

| Script | Purpose |
|--------|---------|
| `create_handoff.py [slug] [--continues-from <file>]` | Generate new handoff with smart scaffolding |
| `list_handoffs.py [path]` | List available handoffs in a project |
| `validate_handoff.py <file>` | Check completeness, quality, and security |
| `check_staleness.py <file>` | Assess if handoff context is still current |

### references/

- [handoff-template.md](references/handoff-template.md) - Complete template structure with guidance
- [resume-checklist.md](references/resume-checklist.md) - Verification checklist for resuming agents

## Playbook Reminder Rule

After generating a session handoff, the agent must check whether the session introduced architectural changes.

Ask explicitly:

"Does this session modify FG Chart Engine architecture and require updating
docs/domain/FG_CHART_ENGINE_PLAYBOOK.md?"

If yes:
- suggest updating the playbook
- propose the exact section that should be updated

If no:
- explicitly confirm that no playbook update is needed.

Never silently skip this check.

## Playbook Update Constraint

When updating docs/domain/FG_CHART_ENGINE_PLAYBOOK.md:

- Do not rewrite the entire document
- Only modify the relevant section
- Preserve existing architectural knowledge
- Prefer append-only updates
- Never convert the playbook into a session log

The playbook is a stable architectural reference.
