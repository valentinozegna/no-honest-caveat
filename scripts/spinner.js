'use strict';

// A loading indicator for a tool that measures stalling. It would be rude to
// make you wait with nothing to read. Finished steps stay on screen as a list;
// only the active one animates.

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
  'Separating the walls from the excuses',
];

const DIM = '\x1b[2m', OFF = '\x1b[0m', TICK = '\x1b[38;5;114m', SPIN = '\x1b[38;5;81m';
const HIDE = '\x1b[?25l', SHOW = '\x1b[?25h';

function start(total) {
  const out = process.stderr;
  if (!out.isTTY && process.env.FORCE_COLOR !== '1') return { tick() {}, stop() {} };

  let frame = 0, done = 0, painted = 0, step = 0, open = false;

  // Hide the cursor so it stops strobing at the end of the active line.
  out.write(HIDE);
  const restore = () => out.write(SHOW);
  process.on('exit', restore);
  process.on('SIGINT', () => { restore(); process.exit(130); });

  const finish = (i) => out.write(`\r\x1b[2K  ${TICK}✓${OFF} ${DIM}${LINES[i]}${OFF}\n`);

  // Steps track real progress through the corpus, not a timer, so the list
  // grows at the pace the scan actually moves.
  const stepFor = () =>
    total ? Math.min(Math.floor((done / total) * LINES.length), LINES.length - 1) : 0;

  const paint = () => {
    painted = Date.now();
    const want = stepFor();
    // Close out every step we passed, so the list never skips a line.
    while (step < want) { finish(step); step++; }
    const pct = total ? Math.floor((100 * done) / total) : 0;
    out.write(`\r\x1b[2K  ${SPIN}${FRAMES[frame++ % FRAMES.length]}${OFF} ${LINES[step]}... ${pct}%`);
    open = true;
  };

  paint();

  return {
    tick() {
      done++;
      if (Date.now() - painted >= 80) paint();
    },
    stop() {
      if (open) finish(step);
      restore();
    },
  };
}

module.exports = { start, LINES, FRAMES };
