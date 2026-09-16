#!/usr/bin/env node
'use strict';

// Scans your Claude Code transcripts and reports how often your closes hand
// unfinished work back. Read-only. Nothing leaves the machine.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { TELLS, closingOf } = require(path.join(__dirname, '..', 'hooks', 'tells.js'));

const ROOT = process.argv[2] || path.join(os.homedir(), '.claude', 'projects');
const APPROVE = /\b(yes|yeah|yep|ok|okay|sure|go ahead|do it|attack|proceed|go for it|do what you|you do you)\b/i;
const DECLINE = /^\s*(no\b|nope|don't|do not|stop\b|leave it|not now|skip (it|that)|hold off)/i;

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

const counts = new Map(TELLS.map(([re]) => [re.source, 0]));
let messages = 0, offers = 0, approved = 0, declined = 0;
const worst = [];

for (const file of walk(ROOT)) {
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
    if (r.type === 'user' && /^(Stop hook feedback:|This session is being continued|Base directory for this skill:|Caveat: The messages below)/.test(text)) continue;
    turns.push({ role: r.type, text });
  }

  for (let i = 0; i < turns.length; i++) {
    if (turns[i].role !== 'assistant') continue;
    messages++;
    const close = closingOf(turns[i].text);
    let flagged = false;
    for (const [re] of TELLS) {
      if (re.test(close)) { counts.set(re.source, counts.get(re.source) + 1); flagged = true; }
    }
    if (!flagged) continue;
    offers++;
    const next = turns[i + 1];
    if (!next || next.role !== 'user') continue;
    const head = next.text.slice(0, 120);
    if (DECLINE.test(head)) declined++;
    else if (APPROVE.test(head)) { approved++; worst.push(close.slice(-160).replace(/\s+/g, ' ')); }
  }
}

const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) : '0.0');

console.log('\n  no-honest-caveat audit');
console.log('  ' + '-'.repeat(46));
console.log(`  assistant messages scanned   ${messages}`);
console.log(`  closes that defer to you     ${offers}  (${pct(offers, messages)}%)`);
console.log(`  you said yes                 ${approved}`);
console.log(`  you said no                  ${declined}`);
if (approved + declined > 0) {
  console.log(`  the ask was load-bearing     ${pct(declined, approved + declined)}% of the time`);
}
console.log('\n  by phrase');
for (const [re] of TELLS) {
  const n = counts.get(re.source);
  if (n) console.log(`    ${String(n).padStart(5)}  /${re.source}/`);
}
if (worst.length) {
  console.log('\n  closes that cost you a round trip for nothing');
  for (const w of worst.slice(0, 5)) console.log(`    ...${w}`);
}
console.log('');
