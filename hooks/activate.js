#!/usr/bin/env node
'use strict';

// Injects the canonical rule at session start so the gate is live before the
// first response, rather than looked up after the habit has already fired.
// The text comes from rules/no-honest-caveat.md so it can never drift.

const fs = require('fs');
const path = require('path');

const root = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
const rulePath = path.join(root, 'rules', 'no-honest-caveat.md');

let rule;
try {
  rule = fs.readFileSync(rulePath, 'utf8').trim();
} catch {
  // A missing rule file must never wedge a session.
  process.exit(0);
}

const context = [
  'no-honest-caveat is ACTIVE for every response, hardest on the last one.',
  '',
  rule,
  '',
  `Full skill: ${path.join(root, 'skills', 'no-honest-caveat', 'SKILL.md')}`,
].join('\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: context,
  },
}));
