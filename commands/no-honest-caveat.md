---
description: Activate no-honest-caveat, or run `audit` to measure the habit in your own transcripts.
argument-hint: "[audit]"
---

Argument: `$ARGUMENTS`

**If the argument is `audit`:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/audit.js"`
and show the output verbatim. It is read-only and nothing leaves the machine.
Then name the single phrase costing the most round trips and what it should
have been instead. Do not offer to fix anything. Fix it going forward.

**Otherwise:** read `${CLAUDE_PLUGIN_ROOT}/skills/no-honest-caveat/SKILL.md` and
hold it for the rest of the session. Confirm in one line, then continue the work
already in progress.
