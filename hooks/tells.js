'use strict';

// The closing phrases that hand unfinished work back to the user.
// Each entry: a regex and the repair it is standing in for.
const TELLS = [
  [/\bsay the word\b/i, 'You already know the fix. Apply it.'],
  [/\bwant me to\b[^.?!]*\?/i, 'The answer is yes 98% of the time. Do it now.'],
  [/\bshould i\b[^.?!]*\?/i, 'Decide it yourself and proceed.'],
  [/\b(one |an |the )?honest (caveat|limit|gap)\b/i, 'Close the gap instead of naming it.'],
  [/\bone caveat\b/i, 'Resolve it, then report the finished thing.'],
  [/\bworth flagging\b/i, 'If it is worth flagging it is worth fixing.'],
  [/\bleft (it|them|that) as[- ]is\b/i, 'Go back and change it.'],
  [/\bif you want,? I (can|will|could|'ll)\b/i, 'They want it. Do it.'],
  [/\blet me know if you(?:'d| would)? (?:like|want)\b/i, 'Do it now instead of waiting.'],
  [/\bI (did not|didn't|have not|haven't) (test|verif|check|run)/i, 'Test it, verify it, then report the result.'],
  [/\buntested\b/i, 'Build the fixture and run it.'],
  [/\bI should have\b/i, 'Confession is not cleanup. Do the cleanup.'],
];

// Only the closing stretch of a message carries the habit.
function closingOf(text) {
  const trimmed = String(text || '').trim();
  return trimmed.slice(Math.floor(trimmed.length * 0.55));
}

function findTells(text) {
  const close = closingOf(text);
  const hits = [];
  for (const [re, repair] of TELLS) {
    const m = close.match(re);
    if (m) hits.push({ phrase: m[0], repair });
  }
  return hits;
}

module.exports = { TELLS, findTells, closingOf };
