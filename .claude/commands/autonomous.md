---
name: "autonomous"
version: "1.0.0"
description: |
  Meta-orchestrator for exhaustive Loa process compliance.
  Ensures autonomous work matches human-level discernment and quality.
  Invokes all Loa skills in correct sequence with mandatory quality gates.

arguments:
  - name: "target"
    type: "string"
    required: false
    description: "Work item or sprint to execute"
  - name: "--dry-run"
    type: "flag"
    description: "Validate without executing"
  - name: "--detect-only"
    type: "flag"
    description: "Only detect operator type, don't execute"
  - name: "--resume-from"
    type: "string"
    description: "Phase to resume from (e.g., 'design')"

agent: "autonomous-agent"
agent_path: "skills/autonomous-agent/"

context_files:
  - path: "grimoires/loa/NOTES.md"
    required: false
    purpose: "Session continuity and working memory"
  - path: ".loa-checkpoint/"
    required: false
    purpose: "Phase checkpoints for resume"

pre_flight:
  - check: "file_exists"
    path: ".loa-version.json"
    error: "Loa not mounted. Run /mount first."

outputs:
  - path: ".loa-checkpoint/{phase}.yaml"
    type: "file"
    description: "Phase checkpoint files"
  - path: "grimoires/loa/feedback/{date}.yaml"
    type: "file"
    description: "Upstream learnings"
  - path: "grimoires/loa/a2a/trajectory/{date}.jsonl"
    type: "file"
    description: "Execution trajectory log"

mode:
  default: "foreground"
  allow_background: false
---

# Autonomous

## Purpose

Meta-orchestrator for exhaustive Loa process compliance. Ensures autonomous work matches human-level discernment and quality by invoking all Loa skills in correct sequence with mandatory quality gates.

## Invocation

```
/autonomous
/autonomous sprint-1
/autonomous --dry-run
/autonomous --detect-only
/autonomous --resume-from=design
```

## Agent

Launches `autonomous-agent` from `skills/autonomous-agent/`.

See: `skills/autonomous-agent/SKILL.md` for full workflow details.

## Prerequisites

- Loa mounted (`.loa-version.json` exists)
- Run `/mount` first if not mounted

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `target` | Work item or sprint to execute | No |
| `--dry-run` | Validate phases without executing | No |
| `--detect-only` | Only detect operator type | No |
| `--resume-from` | Phase to resume from | No |

## Outputs

| Path | Description |
|------|-------------|
| `.loa-checkpoint/{phase}.yaml` | Phase checkpoint files |
| `grimoires/loa/feedback/{date}.yaml` | Upstream learnings |
| `grimoires/loa/a2a/trajectory/{date}.jsonl` | Execution trajectory |

## 8-Phase Execution Model

1. **Phase 0: Preflight** - Operator detection, session continuity, system verification
2. **Phase 1: Discovery** - Codebase grounding, PRD creation/validation
3. **Phase 2: Design** - Architecture (SDD), sprint planning
4. **Phase 3: Implementation** - Task execution with quality gates
5. **Phase 4: Audit** - Security review, code quality
6. **Phase 4.5: Remediation** - Fix audit findings (max 3 loops)
7. **Phase 5: Submit** - Draft PR creation
8. **Phase 6: Deploy** - Infrastructure deployment (optional, requires approval)
9. **Phase 7: Learning** - Feedback capture, PRD iteration check

## Operator Detection

Auto-detects AI vs Human operators:

| Detection Method | Priority |
|------------------|----------|
| Environment variables (`LOA_OPERATOR`, `CLAWDBOT_AGENT`) | Highest |
| AGENTS.md markers | High |
| HEARTBEAT.md patterns | Medium |
| TTY detection | Lowest |

### Behavior Differences

| Operator | Behavior |
|----------|----------|
| **Human** | Interactive, suggestions, flexible process |
| **AI** | Auto-wrap with `/autonomous`, mandatory audit, strict gates |

## Quality Gates (Five Gates Model)

| Gate | Check | V2 Implementation |
|------|-------|-------------------|
| Gate 0 | Right skill? | Human review |
| Gate 1 | Inputs exist? | File check |
| Gate 2 | Executed OK? | Exit code (0/1/2) |
| Gate 3 | Outputs exist? | File check |
| Gate 4 | Goals achieved? | Human review |

## Context Management

| Threshold | Action |
|-----------|--------|
| 80K tokens (soft) | Trigger standard compaction |
| 150K tokens (hard) | Emergency compaction |

## Circuit Breaker

Execution halts if:
- Same finding appears 3 times
- No progress for 5 cycles
- 20 total cycles exceeded
- 8 hour timeout

## Configuration

```yaml
# .loa.config.yaml
autonomous_agent:
  operator:
    type: auto  # auto | human | ai
  audit_threshold: 4
  max_remediation_loops: 3
  context:
    soft_limit_tokens: 80000
    hard_limit_tokens: 150000
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "Loa not mounted" | Missing .loa-version.json | Run `/mount` first |
| "Checkpoint corrupted" | Invalid checkpoint file | Delete checkpoint, restart |
| "Max loops exceeded" | Remediation failed 3 times | Review escalation report |

## Related Commands

- `/run sprint-N` - Execute single sprint autonomously
- `/run sprint-plan` - Execute all sprints sequentially
- `/run-status` - Check current run progress
- `/run-halt` - Gracefully stop execution
- `/run-resume` - Continue from checkpoint

## Documentation

- [Separation of Concerns](docs/architecture/separation-of-concerns.md)
- [Runtime Contract](docs/integration/runtime-contract.md)
- [Integration Tests](docs/planning/autonomous-agent-tests.md)
