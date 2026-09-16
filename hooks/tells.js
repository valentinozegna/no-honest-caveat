'use strict';

// The closing phrases that hand unfinished work back to the user.
// label:  what to call it in a report
// re:     how to spot it
// repair: the work it is standing in for
const TELLS = [
  { label: 'Want me to?',        re: /\bwant me to\b[^.?!]*\?/i,            repair: 'The answer is yes almost every time. Do it now.' },
  { label: 'Say the word',       re: /\bsay the word\b/i,                   repair: 'You already know the fix. Apply it.' },
  { label: 'Should I?',          re: /\bshould i\b[^.?!]*\?/i,              repair: 'Decide it yourself and proceed.' },
  { label: 'Worth flagging',     re: /\bworth flagging\b/i,                 repair: 'If it is worth flagging it is worth fixing.' },
  { label: 'One caveat',         re: /\bone caveat\b/i,                     repair: 'Resolve it, then report the finished thing.' },
  { label: 'An honest caveat',   re: /\b(one |an |the )?honest (caveat|limit|gap)\b/i, repair: 'Close the gap, then report it closed.' },
  { label: 'I should have',      re: /\bI should have\b/i,                  repair: 'Do the cleanup, then say it is done.' },
  { label: 'Untested',           re: /\buntested\b/i,                       repair: 'Build the fixture and run it.' },
  { label: 'I did not verify',   re: /\bI (did not|didn't|have not|haven't) (test|verif|check|run)/i, repair: 'Test it, verify it, then report the result.' },
  { label: 'I left it as-is',    re: /\bleft (it|them|that) as[- ]is\b/i,   repair: 'Go back and change it.' },
  { label: 'If you want, I can', re: /\bif you want,? I (can|will|could|'ll)\b/i, repair: 'They want it. Do it.' },
  { label: 'Let me know if',     re: /\blet me know if you(?:'d| would)? (?:like|want)\b/i, repair: 'Do it now. They already want it.' },
];

// Only the closing stretch of a message carries the habit.
function closingOf(text) {
  const trimmed = String(text || '').trim();
  return trimmed.slice(Math.floor(trimmed.length * 0.55));
}

function findTells(text) {
  const close = closingOf(text);
  const hits = [];
  for (const tell of TELLS) {
    const m = close.match(tell.re);
    if (m) hits.push({ phrase: m[0], label: tell.label, repair: tell.repair });
  }
  return hits;
}

module.exports = { TELLS, findTells, closingOf };
