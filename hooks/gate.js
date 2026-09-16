#!/usr/bin/env node
'use strict';

// Stop hook. Reads the last assistant message and blocks a close that hands
// known, fixable work back to the user. One block per stop: if the model
// insists after being told, it stops.

const fs = require('fs');
const path = require('path');
const { findTells } = require(path.join(__dirname, 'tells.js'));

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch { /* fall through to allow */ }

  if (input.stop_hook_active) return allow();

  const { text, standDown } = readTranscript(input.transcript_path);
  if (standDown) return allow();
  if (!text) return allow();

  const hits = findTells(text);
  if (!hits.length) return allow();

  const lines = hits.map((h) => `  "${h.phrase}" -> ${h.repair}`);
  block([
    'no-honest-caveat: your close hands unfinished work back to the user.',
    '',
    ...lines,
    '',
    'Run the gate: can you resolve this now with the tools and access you',
    'already have? If yes, resolve it and never mention it. If it is genuinely',
    'a decision the user owns, or a wall you cannot climb, state it as one flat',
    'sentence in the body with no question mark, then stop.',
    '',
    'Do the work. Then report what is true about the finished thing.',
  ].join('\n'));
});

const OFF = /\bstop\s+no-honest-caveats?\b/i;
const ON = /\b(start|resume|enable)\s+no-honest-caveats?\b/i;

// Walks back from the end for two things: the newest assistant message to
// judge, and whether the user has told the gate to stand down this session.
function readTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return { text: '', standDown: false };
  const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  let text = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    let row;
    try { row = JSON.parse(lines[i]); } catch { continue; }
    let content = row.message && row.message.content;
    if (typeof content === 'string') content = [{ type: 'text', text: content }];
    if (!Array.isArray(content)) continue;
    const body = content.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n').trim();
    if (!body) continue;

    if (row.type === 'user') {
      // The most recent switch the user threw is the one that counts.
      if (ON.test(body)) return { text, standDown: false };
      if (OFF.test(body)) return { text, standDown: true };
    } else if (row.type === 'assistant' && !text) {
      text = body;
    }
  }
  return { text, standDown: false };
}

function allow() { process.exit(0); }

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}
