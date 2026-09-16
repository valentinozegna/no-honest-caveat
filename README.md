# no-honest-caveat

[![skills.sh](https://skills.sh/b/valentinozegna/no-honest-caveats)](https://skills.sh/valentinozegna/no-honest-caveats)

> A caveat is a defect you found, understood, priced, and typed out instead of
> repaired. You already did the expensive part. Finish.

You know the ending. The agent works for twenty minutes, ships something good,
then closes with **"one honest caveat"**, **"worth flagging"**, **"Say the word
and I'll fix it"**. It diagnosed the problem correctly. It knew the repair. It
typed the repair into a sentence and handed the sentence back to you.

This plugin ends that.

## Where it comes from

Built from an audit of thousands of real agent transcripts, looking at one
thing: what happens in the last paragraph, and what the user says next.

The finding is consistent. Deferring closes cluster at the end of otherwise
finished work. The overwhelming majority are answered "yes", "go ahead", "do
it". And the repair is almost always named in the same sentence as the excuse,
which means the agent knew the fix and described it instead of applying it.

The question was a round trip to arrive exactly where the agent already stood.

Measure it on your own history. Read-only, and nothing leaves the machine:

```bash
npx -y github:valentinozegna/no-honest-caveats
```

Once installed as a plugin, `/no-honest-caveat audit` does the same thing. It
prints your counts by phrase, how often you answered yes, how often the ask was
load-bearing, and the closes that cost you a round trip for nothing.

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

MIT. Inspired by the packaging of [ponytail](https://github.com/dietrichgebert/ponytail).
