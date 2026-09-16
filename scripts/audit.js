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

const TTY = process.stdout.isTTY || process.env.FORCE_COLOR === '1';
const e = (code) => (TTY ? `\x1b[${code}m` : '');
const C = {
  off: e(0), bold: e(1), dim: e(2),
  title: e('1;38;5;81'),      // bright cyan, the product name
  head: e('1;38;5;213'),      // pink, section headings
  accent: e('38;5;81'),       // cyan, rules and marks
  value: e('1;38;5;255'),     // bold white, the numbers that matter
  label: e('38;5;249'),       // soft grey, the words beside them
  good: e('38;5;114'),        // green
  bad: e('38;5;203'),         // red
  warn: e('38;5;221'),        // amber
  quiet: e('38;5;243'),       // dim grey, footnotes
  caught: e('1;38;5;211'),    // hot pink, the phrase that did it
  hot: e('38;5;203'), mid: e('38;5;221'), cool: e('38;5;74'),
};

// Show the stretch containing the tell, not whatever happened to be last.
function excerpt(close, width = 150) {
  const flat = close.replace(/\s+/g, ' ').trim();
  let at = -1;
  for (const t of TELLS) {
    const m = flat.match(t.re);
    if (m && m.index !== undefined && (at === -1 || m.index < at)) at = m.index;
  }
  if (at === -1) return flat.slice(-width);
  const start = Math.max(0, at - Math.floor(width / 3));
  return (start ? '...' : '') + flat.slice(start, start + width);
}

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
      wasted.push(excerpt(close));
    }
  }
}

bar.stop();
report();

function report() {
  const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) : '0.0');
  const answered = approved + declined;
  const w = 64;
  const rule = () => `  ${C.quiet}${'─'.repeat(w)}${C.off}`;
  const heading = (t) => `  ${C.accent}▌${C.off} ${C.head}${t}${C.off}`;

  console.log('');
  console.log(`  ${C.title}no-honest-caveat${C.off}  ${C.quiet}·${C.off}  ${C.label}the audit${C.off}`);
  console.log(rule());

  if (!messages) {
    console.log(`\n  ${C.label}No transcripts found in${C.off} ${C.value}${ROOT}${C.off}\n`);
    console.log(`  ${C.quiet}Point it somewhere else: npx ... <dir>${C.off}\n`);
    return;
  }

  console.log('');
  row('assistant messages read', `${C.value}${messages}${C.off}`);
  row('closes that defer to you', `${C.warn}${C.bold}${offers}${C.off}   ${C.quiet}${pct(offers, messages)}% of everything you wrote${C.off}`);
  if (answered) {
    row('of those, you replied to', `${C.value}${answered}${C.off}`);
    row('you said yes', `${C.good}${C.bold}${approved}${C.off}`);
    row('you said no', `${C.bad}${C.bold}${declined}${C.off}`);
    console.log('');
    const load = Number(pct(declined, answered));
    const tail = load === 0
      ? 'Never. Every question was a round trip to nowhere.'
      : load < 10 ? `${load}% of the time. The other ${(100 - load).toFixed(1)}% was a formality.`
      : load < 25 ? `${load}% of the time. Rather less than it felt like.`
      : `${load}% of the time. Unusually load-bearing, for this habit.`;
    console.log(`  ${C.head}The question mattered${C.off}${C.quiet}:${C.off} ${C.label}${tail}${C.off}`);
  }

  const ranked = TELLS.map((t) => [t.label, counts.get(t.label)]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  if (ranked.length) {
    console.log('');
    console.log(rule());
    console.log(heading('Greatest hits'));
    console.log('');
    const max = ranked[0][1];
    for (const [label, n] of ranked) {
      const share = n / max;
      const tint = share > 0.5 ? C.hot : share > 0.15 ? C.mid : C.cool;
      const bars = Math.max(1, Math.round(share * 24));
      console.log(
        `  ${C.value}${String(n).padStart(6)}${C.off}  ${tint}${'▇'.repeat(bars)}${C.off}` +
        `${' '.repeat(25 - bars)}${C.label}"${label}"${C.off}`
      );
    }
  }

  if (wasted.length) {
    console.log('');
    console.log(rule());
    console.log(heading('Closes that cost you a round trip for nothing'));
    console.log('');
    for (const line of wasted.slice(0, 5)) {
      const text = line;
      const hot = guilty(text);
      for (const seg of wrap(text, w - 4)) {
        console.log(`  ${C.accent}│${C.off} ${paint(text, hot, seg.start, seg.end, C.quiet, C.caught)}`);
      }
      console.log(`  ${C.accent}│${C.off}`);
    }
  }

  console.log(rule());
  const closer = answered
    ? `${approved} of ${answered} questions ended in "yes". That work could simply have been done.`
    : offers
      ? `${offers} times the work stopped one step short of finished.`
      : 'Nothing deferred. Suspicious, but nothing deferred.';
  console.log(`  ${C.label}${closer}${C.off}`);
  console.log(`  ${C.quiet}github.com/valentinozegna/no-honest-caveat${C.off}`);
  console.log('');

  function row(label, value) {
    console.log(`  ${C.label}${label.padEnd(30)}${C.off}${value}`);
  }
}

// Wrap, but report where each line started, so a highlight can be re-applied
// to the right characters even when a phrase straddles a break.
function wrap(text, width) {
  const lines = [];
  let start = 0, end = 0;
  while (start < text.length) {
    if (text.length - start <= width) { lines.push({ start, end: text.length }); break; }
    end = text.lastIndexOf(' ', start + width);
    if (end <= start) end = start + width;
    lines.push({ start, end });
    start = end + 1;
  }
  return lines;
}

// Every character covered by a tell, so the guilty phrase lights up inside the
// quote instead of the reader hunting for it.
function guilty(text) {
  const hot = new Array(text.length).fill(false);
  for (const t of TELLS) {
    const re = new RegExp(t.re.source, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      for (let i = m.index; i < m.index + m[0].length; i++) hot[i] = true;
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  return hot;
}

function paint(text, hot, from, to, cool, warm) {
  let out = '', run = '', state = null;
  for (let i = from; i < to; i++) {
    if (hot[i] !== state) {
      if (run) out += (state ? warm : cool) + run + '\x1b[0m';
      run = ''; state = hot[i];
    }
    run += text[i];
  }
  if (run) out += (state ? warm : cool) + run + '\x1b[0m';
  return out;
}
