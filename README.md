<div align="center">

# no-honest-caveat

<img src="assets/yo-dawg.jpg" width="520" alt="Yo dawg, I heard you liked caveats, so I put a caveat in your caveat so you can caveat whilst you caveat">

### A caveat is a defect you found, understood, priced,<br>and typed out instead of repaired.<br>You already did the expensive part. Finish.

[![tests](https://github.com/valentinozegna/no-honest-caveat/actions/workflows/test.yml/badge.svg)](https://github.com/valentinozegna/no-honest-caveat/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![skills.sh](https://img.shields.io/badge/skills.sh-no--honest--caveat-black)](https://skills.sh/valentinozegna/no-honest-caveat)

</div>

You know the ending. The agent works for twenty minutes, ships something good,
then closes with **"one honest caveat"**, **"worth flagging"**, **"Say the word
and I'll fix it"**. It diagnosed the problem correctly. It knew the repair. It
typed the repair into a sentence and handed the sentence back to you.

This plugin ends that.

## You said yes

Here is the part that takes a while to notice.

In the moment it reads as diligence. You are busy, the work looks done, and
somebody is being straight with you about a loose end. You type "yes". You move
on. It costs four seconds and it feels like good management.

A specimen you have already nodded at:

> The migration is complete and all forty tables moved cleanly.
>
> **One honest caveat:** the rollback path is untested. Building a fixture
> would take about fifteen minutes. Say the word and I'll cover it.

Every sentence is true. That is the craft. Nothing hidden, nothing overstated,
and the rollback path is still untested and somehow it is now your turn.

You find out months later, scrolling back, that it was never one loose end. It
was a habit with a shape: the diagnosis, precise and already finished, which
was the expensive part. The pivot, "one honest caveat". The repair, named
exactly, priced to the minute, not applied. And the handoff, where you say
*yes* for the four hundredth time.

You were not being informed. You were being asked to co-sign, and you signed
everything, because each one arrived alone and looked reasonable.

Nobody has ever written "one dishonest caveat". The adjective is not describing
the caveat, it is describing the author. There is a name for a colleague who
diagnoses your problem, prices the repair, writes it all up, then asks whether
you would like them to proceed. The name is *consultant*. You did not hire a
consultant.

Your own numbers, read-only, nothing leaving your machine:

```bash
npx -y github:valentinozegna/no-honest-caveat
```

It ranks the phrases you close with and counts how often the question carried
information. On the transcripts this was built from: 487 of them, and 69 times
out of 80 the answer was just yes.

## Install

**Skills CLI** (Claude Code, Cursor, Codex, Copilot, Gemini, and the rest):

```bash
npx skills add valentinozegna/no-honest-caveat
```

**Claude Code plugin**, which adds the enforcement hooks and the slash command:

```
/plugin marketplace add valentinozegna/no-honest-caveat
/plugin install no-honest-caveat
```

**Any other agent**: copy `rules/no-honest-caveat.md` into whatever file your
agent reads. It already ships at every common path (`AGENTS.md`, `GEMINI.md`,
`.cursor/rules/`, `.clinerules/`, `.github/copilot-instructions.md`, and more).

## What you get

The skill, the audit, and a Stop hook that reads your closing paragraph and
blocks a close that defers known work:

```
no-honest-caveat: your close hands unfinished work back to the user.

  "Say the word" -> You already know the fix. Apply it.
  "One honest caveat" -> Close the gap instead of naming it.
  "untested" -> Build the fixture and run it.
```

It will not push an agent into faking a finish. A decision you own, a wall it
cannot climb, and bias in its own instrument still get said, once, flatly.

## Develop

```bash
npm test                            # 18 tests
node scripts/build-rules.js         # regenerate the agent rule copies
node scripts/build-rules.js --check # verify they are in sync
node scripts/audit.js [dir]         # audit any transcript directory
```

Edit the rule in `rules/no-honest-caveat.md`, then run the build. A test fails
if the copies drift.

## Turning it off

```
stop no-honest-caveat
```

MIT.
