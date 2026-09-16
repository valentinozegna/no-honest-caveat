'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

test('skill stays under 200 lines', () => {
  const lines = read('skills/no-honest-caveat/SKILL.md').split('\n').length;
  assert.ok(lines <= 200, `SKILL.md is ${lines} lines`);
});

test('skill has the frontmatter Claude Code needs', () => {
  const src = read('skills/no-honest-caveat/SKILL.md');
  assert.match(src, /^---\nname: no-honest-caveat\ndescription: >/);
  assert.match(src, /\n---\n/);
});

test('no em-dashes anywhere in the shipped text', () => {
  for (const f of ['skills/no-honest-caveat/SKILL.md', 'rules/no-honest-caveat.md', 'README.md', 'commands/no-honest-caveat.md']) {
    assert.ok(!read(f).includes('—'), `em-dash in ${f}`);
  }
});

test('versions agree across manifests', () => {
  assert.equal(json('.claude-plugin/plugin.json').version, json('package.json').version);
});

test('hooks/hooks.json exists, parses, and wires the events we rely on', () => {
  const hooks = json('hooks/hooks.json');
  for (const evt of ['SessionStart', 'SubagentStart', 'Stop']) {
    assert.ok(hooks.hooks[evt], `missing ${evt} hook`);
  }
});

// Claude Code discovers hooks/hooks.json on its own. Naming it again in the
// manifest registers it twice and the whole hooks file is rejected.
test('the manifest leaves the standard hooks path alone', () => {
  const declared = json('.claude-plugin/plugin.json').hooks;
  if (declared === undefined) return;
  const paths = (Array.isArray(declared) ? declared : [declared]).map((h) => h.replace(/^\.\//, ''));
  assert.ok(!paths.includes('hooks/hooks.json'),
    'plugin.json must not re-declare hooks/hooks.json; it loads automatically');
});

test('marketplace lists the plugin', () => {
  assert.equal(json('.claude-plugin/marketplace.json').plugins[0].name, 'no-honest-caveat');
});

test('rule copies are in sync with the canonical rule', () => {
  execFileSync('node', [path.join(ROOT, 'scripts', 'build-rules.js'), '--check']);
});

test('audit runs on a tree with no transcripts and says so', () => {
  const out = execFileSync('node', [path.join(ROOT, 'scripts', 'audit.js'), path.join(ROOT, 'tests')], { encoding: 'utf8' });
  assert.match(out, /no-honest-caveat/);
  assert.match(out, /No transcripts found/);
});

test('every tell carries a label and a repair', () => {
  const { TELLS } = require('../hooks/tells.js');
  for (const t of TELLS) {
    assert.ok(t.label && t.re instanceof RegExp && t.repair, `incomplete tell: ${t.label}`);
    assert.ok(!t.label.startsWith('/'), 'labels must be human text, not regex source');
  }
  assert.equal(new Set(TELLS.map((t) => t.label)).size, TELLS.length, 'labels must be unique');
});

test('audit stays plain when piped and colours on request', () => {
  const args = [path.join(ROOT, 'scripts', 'audit.js'), path.join(ROOT, 'tests')];
  const plain = execFileSync('node', args, { encoding: 'utf8' });
  assert.ok(!plain.includes('\x1b['), 'piped output must carry no escape codes');

  const colour = execFileSync('node', args, {
    encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '1' },
  });
  assert.ok(colour.includes('\x1b['), 'FORCE_COLOR=1 must colour the output');
});
