# no-honest-caveat

[![skills.sh](https://skills.sh/b/valentinozegna/no-honest-caveats)](https://skills.sh/valentinozegna/no-honest-caveats)

<img src="assets/yo-dawg.jpg" alt="Yo dawg, I heard you liked caveats, so I put a caveat in your caveat so you can caveat whilst you caveat" width="520">

> A caveat is a defect you found, understood, priced, and typed out instead of
> repaired. You already did the expensive part. Finish.

You know the ending. The agent works for twenty minutes, ships something good,
then closes with **"one honest caveat"**, **"worth flagging"**, **"Say the word
and I'll fix it"**. It diagnosed the problem correctly. It knew the repair. It
typed the repair into a sentence and handed the sentence back to you.

This plugin ends that.

## The genre

The caveat is the most refined method of not doing something yet devised.

Laziness is visible. Refusal is at least honest. The caveat is neither. It is a
complete, accurate, well-written description of the work, delivered in place of
the work, in a tone that invites you to be grateful for it.

A specimen, lightly edited from the wild:

> The migration is complete and all forty tables moved cleanly.
>
> **One honest caveat:** the rollback path is untested. Building a fixture for
> it would take about fifteen minutes. Say the word and I'll cover it.

Every sentence there is true. That is the craft. Nothing has been hidden from
you, nothing overstated, and at the end of it the rollback path is still
untested and now it is somehow your turn.

The form has four movements, and they never vary:

1. **The diagnosis.** Precise, correct, frequently impressive. This is the
   expensive part and it is already finished.
2. **The pivot.** "One honest caveat." "Worth flagging." "To be upfront."
3. **The repair, described.** Named exactly. Priced to the minute. Not applied.
4. **The handoff.** "Say the word." "Want me to?" And your line, which you have
   delivered four hundred times: *yes*.

You are not being informed. You are being asked to co-sign.

## The word doing the work

Note that nobody has ever written "one dishonest caveat."

The adjective is not describing the caveat. It is describing the author. It
arrives to make you feel that being told about the problem is itself a service,
performed at some cost, by someone of unusual integrity, who has chosen candour
over the easier path of quietly fixing it.

There is a name for a colleague who diagnoses your problem correctly, prices
the repair, writes the whole thing up, and then asks whether you would like
them to proceed.

The name is *consultant*. You did not hire a consultant.

## What the counting turned up

We read a great many real transcripts, looking at exactly one thing: the last
paragraph, and whatever the human said next.

The results are not flattering to anybody involved.

Deferring closes cluster at the end of otherwise finished work, which is to
say the habit waits until the hard part is over and then appears. The
overwhelming majority are answered "yes", "go ahead", "do it". And the repair
is very nearly always named in the same sentence as the excuse for not doing
it, which settles the question of whether the agent knew how.

It knew. It wrote it down. It asked permission to do the thing it had just
finished explaining.

The question was a round trip to arrive at precisely the spot where everyone
was already standing.

Run the numbers on your own history, if you are feeling robust. Read-only, and
nothing leaves your machine:

```bash
npx -y github:valentinozegna/no-honest-caveats
```

It prints your counts by phrase, how often you said yes, how rarely the
question carried any information at all, and a short list of the closes that
cost you a round trip for nothing. Installed as a plugin,
`/no-honest-caveat audit` does the same.

## Install

**Skills CLI** (Claude Code, Cursor, Codex, Copilot, Gemini, and the rest):

```bash
npx skills add valentinozegna/no-honest-caveats
```

That installs the skill itself, which is self-sufficient.

**Claude Code plugin**, which adds the enforcement hooks and the `/no-honest-caveat`
command on top of the skill:

```
/plugin marketplace add valentinozegna/no-honest-caveats
/plugin install no-honest-caveat
```

**Any other agent**: copy `rules/no-honest-caveat.md` into the file your agent
reads. This repo already ships it at every common path (`AGENTS.md`,
`GEMINI.md`, `.cursor/rules/`, `.clinerules/`, `.github/copilot-instructions.md`,
`.agents/rules/`, `.kiro/steering/`), generated from one source so they never
drift.

| | Skills CLI | Claude Code plugin | Rule file |
|---|---|---|---|
| the skill | yes | yes | condensed |
| session activation hook | | yes | |
| Stop hook that blocks a caveat close | | yes | |
| `/no-honest-caveat audit` | | yes | |

The audit runs from anywhere without installing:

```bash
npx -y github:valentinozegna/no-honest-caveats
```

## What you get

**The skill** (`skills/no-honest-caveat/SKILL.md`) teaches one gate:

> Can I resolve this now, with the tools and access I already have?
>
> **Yes** → resolve it, then never mention it. A repaired defect is not news.
> **No** → one flat sentence in the body. No header, no "honest", no question mark.

It carries twelve real caveats from the transcripts next to the repair each one
was standing in for, so the pattern is recognisable rather than abstract.

**The Stop hook** reads your closing paragraph before the turn ends. If it finds
a phrase that defers known work, it blocks and names the repair:

```
no-honest-caveat: your close hands unfinished work back to the user.

  "Say the word" -> You already know the fix. Apply it.
  "One honest caveat" -> Close the gap instead of naming it.
  "untested" -> Build the fixture and run it.
```

It fires once per stop, so it can never loop.

**The audit** measures the habit in your own transcripts and shows you the five
closes that cost you a round trip for nothing.

## What it deliberately does not do

It never pushes an agent into claiming a finish it did not reach. A false
completion is worse than a caveat, because a caveat is at least true. The rule
is *do the work*, never *say it is done*, and the skill spends a section on it.

Three things still survive the gate and always will: a decision you own (scope,
money, taste, anything irreversible or outward-facing), a wall the agent cannot
climb (missing hardware, dead API, credentials it was never given), and bias in
its own instrument. Each gets one flat sentence, placed where it is relevant.

Deleting data, pushing to a remote, sending mail: it still confirms, always.

## Develop

```bash
npm test                            # 14 tests
node scripts/build-rules.js         # regenerate the agent rule copies
node scripts/build-rules.js --check # verify they are in sync
node scripts/audit.js [dir]         # audit any transcript directory
```

Editing the rule means editing `rules/no-honest-caveat.md`, then running the
build. The copies are generated, and a test fails if they drift.

## Turning it off

```
stop no-honest-caveat
```

MIT.
