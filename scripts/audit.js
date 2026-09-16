#!/usr/bin/env node
'use strict';

// Scans your agent transcripts and reports how often your closes hand
// unfinished work back. Read-only. Nothing leaves the machine.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TELLS, closingOf } = require(path.join(__dirname, '..', 'hooks', 'tells.js'));
const spinner = require(path.join(__dirname, 'spinner.js'));

const ROOT = process.argv[2] || path.join(os.homedir(), '.claude', 'projects');
const APPROVE = /\b(yes|yeah|yep|ok|okay|sure|go ahead|do it|attack|proceed|go for it|do what you|you do you)\b/i;
const DECLINE = /^\s*(no\b|nope|don't|do not|stop\b|leave it|not now|skip (it|that)|hold off)/i;
const MACHINE = /^(Stop hook feedback:|This session is being continued|Base directory for this skill:|Caveat: The messages below)/;

const C = process.stdout.isTTY
  ? { dim: '\x1b[2m', bold: '\x1b[1m', red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m', off: '\x1b[0m' }
  : { dim: '', bold: '', red: '', yellow: '', green: '', off: '' };

function walk(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const bar = spinner.start(files.length);

const counts = new Map(TELLS.map((t) => [t.label, 0]));
let messages = 0, offers = 0, approved = 0, declined = 0;
const wasted = [];

for (const file of files) {
  bar.tick();
  let rows;
  try {
    rows = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    });
  } catch { continue; }

  const turns = [];
  for (const r of rows) {
    if (!r || (r.type !== 'assistant' && r.type !== 'user')) continue;
    let c = r.message && r.message.content;
    if (typeof c === 'string') c = [{ type: 'text', text: c }];
    if (!Array.isArray(c)) continue;
    const text = c.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n').trim();
    if (!text || text.startsWith('<')) continue;
    // Hook output and context summaries are machine turns, not the user speaking.
    if (r.type === 'user' && MACHINE.test(text)) continue;
    turns.push({ role: r.type, text });
  }

  for (let i = 0; i < turns.length; i++) {
    if (turns[i].role !== 'assistant') continue;
    messages++;
    const close = closingOf(turns[i].text);
    let flagged = false;
    for (const t of TELLS) {
      if (t.re.test(close)) { counts.set(t.label, counts.get(t.label) + 1); flagged = true; }
    }
    if (!flagged) continue;
    offers++;
    const next = turns[i + 1];
    if (!next || next.role !== 'user') continue;
    const head = next.text.slice(0, 120);
    if (DECLINE.test(head)) declined++;
    else if (APPROVE.test(head)) {
      approved++;
      wasted.push(close.slice(-150).replace(/\s+/g, ' ').trim());
    }
  }
}

bar.stop();
report();

function report() {
  const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) : '0.0');
  const answered = approved + declined;
  const w = 62;
  const rule = (ch) => C.dim + '  ' + ch.repeat(w) + C.off;

  console.log('');
  console.log(`  ${C.bold}no-honest-caveat${C.off}${C.dim} · the audit${C.off}`);
  console.log(rule('─'));

  if (!messages) {
    console.log(`\n  No transcripts found in ${ROOT}\n`);
    console.log(`  ${C.dim}Point it somewhere else: npx ... <dir>${C.off}\n`);
    return;
  }

  row('assistant messages read', messages);
  row('closes that defer to you', `${offers}   ${C.dim}${pct(offers, messages)}% of everything you wrote${C.off}`);
  if (answered) {
    row('of those, you replied to', answered);
    row('you said yes', `${C.green}${approved}${C.off}`);
    row('you said no', `${C.red}${declined}${C.off}`);
    console.log('');
    const load = Number(pct(declined, answered));
    const verdict = load === 0
      ? 'Never. Every single question was a round trip to nowhere.'
      : load < 10 ? `${load}% of the time. The other ${(100 - load).toFixed(1)}% was a formality.`
      : load < 25 ? `${load}% of the time. Rather less than it felt like.`
      : `${load}% of the time. Unusually load-bearing, for this habit.`;
    console.log(`  ${C.bold}The question mattered:${C.off} ${verdict}`);
  }

  const ranked = TELLS.map((t) => [t.label, counts.get(t.label)]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  if (ranked.length) {
    console.log('');
    console.log(rule('─'));
    console.log(`  ${C.bold}Greatest hits${C.off}`);
    console.log('');
    const max = ranked[0][1];
    for (const [label, n] of ranked) {
      const bars = Math.max(1, Math.round((n / max) * 24));
      console.log(
        `  ${String(n).padStart(6)}  ${C.yellow}${'▇'.repeat(bars)}${C.off}` +
        `${' '.repeat(25 - bars)}${C.dim}"${label}"${C.off}`
      );
    }
  }

  if (wasted.length) {
    console.log('');
    console.log(rule('─'));
    console.log(`  ${C.bold}Closes that cost you a round trip for nothing${C.off}`);
    console.log('');
    for (const line of wasted.slice(0, 5)) {
      for (const chunk of wrap(`...${line}`, w - 4)) console.log(`  ${C.dim}│${C.off} ${chunk}`);
      console.log(`  ${C.dim}│${C.off}`);
    }
  }

  console.log(rule('─'));
  console.log(`  ${C.dim}The repair was named in the same sentence as the excuse.${C.off}`);
  console.log(`  ${C.dim}github.com/valentinozegna/no-honest-caveat${C.off}`);
  console.log('');

  function row(label, value) {
    console.log(`  ${label.padEnd(30)}${C.bold}${value}${C.off}`);
  }
}

function wrap(text, width) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) { lines.push(line.trim()); line = word; }
    else line += ' ' + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
