'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { findTells, closingOf } = require('../hooks/tells.js');

const PAD = 'The migration ran and all 40 tables moved cleanly. '.repeat(8);

function runGate(text, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nhc-'));
  const tp = path.join(dir, 't.jsonl');
  fs.writeFileSync(tp, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }));
  const out = execFileSync('node', [path.join(__dirname, '..', 'hooks', 'gate.js')], {
    input: JSON.stringify({ transcript_path: tp, ...extra }), encoding: 'utf8',
  });
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

test('blocks a close that defers known work', () => {
  const out = runGate(PAD + 'One honest caveat: rollback is untested. Say the word and I will cover it.');
  const res = JSON.parse(out);
  assert.equal(res.decision, 'block');
  assert.match(res.reason, /Say the word/);
  assert.match(res.reason, /One honest caveat/);
});

test('allows a close that reports a finished thing', () => {
  assert.equal(runGate(PAD + 'All 40 tables migrated, rollback verified on a scratch database, 0 failures.'), '');
});

test('allows a user-owned decision stated without a question mark', () => {
  assert.equal(runGate(PAD + 'No iOS device is attached to this machine, so timings are macOS only.'), '');
});

test('does not fire on a tell that appears early in a long message', () => {
  assert.deepEqual(findTells('Say the word. ' + PAD + PAD), []);
});

test('respects stop_hook_active so it never loops', () => {
  assert.equal(runGate(PAD + 'Say the word and I will fix it.', { stop_hook_active: true }), '');
});

test('closingOf looks at the last 45 percent', () => {
  assert.equal(closingOf('a'.repeat(100)).length, 45);
});

test('activate injects the canonical rule, not a second copy of it', () => {
  const rule = fs.readFileSync(path.join(__dirname, '..', 'rules', 'no-honest-caveat.md'), 'utf8').trim();
  const out = execFileSync('node', [path.join(__dirname, '..', 'hooks', 'activate.js')], { encoding: 'utf8' });
  const ctx = JSON.parse(out).hookSpecificOutput.additionalContext;
  assert.ok(ctx.includes(rule), 'activate.js must emit rules/no-honest-caveat.md verbatim');
  assert.match(ctx, /ACTIVE for every response/);
});

test('activate exits quietly when the rule file is missing', () => {
  const out = execFileSync('node', [path.join(__dirname, '..', 'hooks', 'activate.js')], {
    encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_ROOT: os.tmpdir() },
  });
  assert.equal(out, '');
});

function runGateWithTurns(turns, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nhc-'));
  const tp = path.join(dir, 't.jsonl');
  fs.writeFileSync(tp, turns.map((t) =>
    JSON.stringify({ type: t.role, message: { content: [{ type: 'text', text: t.text }] } })
  ).join('\n'));
  const out = execFileSync('node', [path.join(__dirname, '..', 'hooks', 'gate.js')], {
    input: JSON.stringify({ transcript_path: tp, ...extra }), encoding: 'utf8',
  });
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

const DEFER = PAD + 'Say the word and I will fix it.';

test('"stop no-honest-caveat" stands the gate down', () => {
  assert.equal(runGateWithTurns([
    { role: 'user', text: 'stop no-honest-caveat' },
    { role: 'assistant', text: DEFER },
  ]), '');
});

test('the gate still fires before the user says stop', () => {
  const out = runGateWithTurns([
    { role: 'user', text: 'go ahead' },
    { role: 'assistant', text: DEFER },
  ]);
  assert.equal(JSON.parse(out).decision, 'block');
});

test('starting it again overrides an earlier stop', () => {
  const out = runGateWithTurns([
    { role: 'user', text: 'stop no-honest-caveat' },
    { role: 'assistant', text: 'fine.' },
    { role: 'user', text: 'start no-honest-caveat' },
    { role: 'assistant', text: DEFER },
  ]);
  assert.equal(JSON.parse(out).decision, 'block');
});
