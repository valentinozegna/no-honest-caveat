'use strict';

// A loading indicator for a tool that measures stalling. It would be rude to
// make you wait with nothing to read.

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const LINES = [
  'Locating the last paragraph of every conversation',
  'Isolating the word "honest"',
  'Measuring the distance between diagnosis and repair',
  'Tallying gaps announced but never closed',
  'Counting the times you typed "yes"',
  'Reconstructing round trips to nowhere',
  'Weighing candour against output',
  'Cataloguing work described instead of done',
  'Appraising the craft of the graceful deferral',
  'Pricing the honesty surcharge',
  'Reviewing offers you were always going to accept',
  'Consulting the archive of things flagged for later',
  'Searching for a caveat that earned its keep',
  'Cross-referencing "worth flagging" against "was it though"',
  'Separating the walls from the excuses',
  'Auditing twenty minutes of work and one closing question',
];

function start(total) {
  const out = process.stderr;
  if (!out.isTTY) return { tick() {}, stop() {} };

  let frame = 0, done = 0, painted = 0;
  const started = Date.now();

  // The scan is a synchronous loop, so a timer would never get to run.
  // Paint from inside tick(), throttled, which is the only moment we own.
  const paint = () => {
    const now = Date.now();
    painted = now;
    const spin = FRAMES[frame++ % FRAMES.length];
    const line = LINES[Math.floor((now - started) / 900) % LINES.length];
    const pct = total ? Math.floor((100 * done) / total) : 0;
    out.write(`\r\x1b[2K  ${spin}  ${line}... ${pct}%`);
  };

  paint();

  return {
    tick() {
      done++;
      if (Date.now() - painted >= 80) paint();
    },
    stop() { out.write('\r\x1b[2K'); },
  };
}

module.exports = { start, LINES, FRAMES };
