#!/usr/bin/env node
'use strict';

// One canonical rule, rules/no-honest-caveat.md, fanned out to every agent
// that reads a different path. Run after editing the rule. `--check` verifies
// the copies match instead of writing them.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RULE = fs.readFileSync(path.join(ROOT, 'rules', 'no-honest-caveat.md'), 'utf8');

const FRONT_CURSOR = [
  '---',
  'description: Finish the work instead of confessing about it. No closing caveats, no "Say the word", no "Want me to?".',
  'alwaysApply: true',
  '---',
  '',
].join('\n');

const TARGETS = [
  ['.cursor/rules/no-honest-caveat.mdc', FRONT_CURSOR + RULE],
  ['.clinerules/no-honest-caveat.md', RULE],
  ['.agents/rules/no-honest-caveat.md', RULE],
  ['.kiro/steering/no-honest-caveat.md', RULE],
  ['.github/copilot-instructions.md', RULE],
  ['AGENTS.md', RULE],
  ['GEMINI.md', RULE],
];

const check = process.argv.includes('--check');
let failed = 0;

for (const [rel, content] of TARGETS) {
  const abs = path.join(ROOT, rel);
  if (check) {
    const actual = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    if (actual !== content) { console.error(`stale: ${rel}`); failed++; }
  } else {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    console.log(`wrote ${rel}`);
  }
}

if (check && failed) { console.error(`\n${failed} stale copies. Run: node scripts/build-rules.js`); process.exit(1); }
if (check) console.log(`${TARGETS.length} rule copies in sync.`);
