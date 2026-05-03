---
title: "VS Code Has Been Silently Adding 'Co-Authored-by: Copilot' to Your Commits"
date: "2026-05-03"
excerpt: "Since April 16, VS Code 1.117.0 changed a default that adds Copilot co-authorship trailers to every commit — including ones you wrote by hand. Here's how to audit your history and turn it off."
tags: ["Git", "VS Code", "AI Tools", "Developer Tools"]
coverEmoji: "🔏"
auto_generated: true
source_url: "https://github.com/microsoft/vscode/pull/310226"
---

On April 16, VS Code shipped version 1.117.0 with a one-line change that a lot of developers missed: it flipped the default for `git.addAICoAuthor` from `"off"` to `"all"`. The result is that `Co-authored-by: Copilot` trailers have been silently appended to commits for anyone running a recent VS Code version — including commits written entirely by hand, with no AI involvement.

This is now sitting at the top of Hacker News. Worth understanding what it actually does, why it matters, and how to clean it up.

## What the change does

Git trailers are structured metadata you can add after a commit message body, separated by a blank line:

```
feat(auth): add token refresh on 401

This handles the race condition where multiple requests fire before
the access token expires.

Co-authored-by: Copilot <>
```

GitHub and GitLab parse these and display the named accounts as co-authors on the commit, complete with avatar in the UI. VS Code's change makes this happen automatically on every commit you make from the editor.

The PR description frames it as a transparency measure — acknowledging AI assistance in the git record. That's a reasonable goal in principle. The problem is the implementation: the setting was changed to opt-out rather than opt-in, it fires even when you haven't used Copilot for that particular commit, and — critically — it was reported to add the trailer even when `chat.disableAIFeatures: true` is set. That's false attribution. The VS Code team acknowledged the regression and says fixes are coming in 1.119.

## Why this actually matters

Three things make this more than a minor annoyance.

**Open source licensing.** Some licences and project contributor agreements care about authorship. If you're contributing to an Apache or GPL project that requires a DCO sign-off, having a corporate product listed as co-author on commits you wrote manually complicates the attribution chain. Most maintainers won't care in practice, but the automated trailer doesn't distinguish between "Copilot generated this function" and "Copilot was running in the background while I typed."

**Employer IP policies.** Some organisations have policies around AI tool use in codebases — particularly in regulated industries (finance, health, defence). A `Co-authored-by: Copilot` trailer in your commit history is a permanent record, and it's there regardless of whether AI was actually involved. If your workplace has policies here, check your recent commits.

**Code review signal.** Teams increasingly use AI attribution to calibrate how closely to review a change. False positives degrade that signal. If every commit gets the trailer, reviewers learn to ignore it, and it becomes noise.

## Auditing your recent commits

Check whether the trailer has been added to your recent work:

```bash
# Check last 30 commits in the current repo
git log --format="%H %s" -30 | while read hash msg; do
  trailer=$(git show "$hash" | grep -i "co-authored-by")
  if [ -n "$trailer" ]; then
    echo "$hash: $msg"
    echo "  → $trailer"
  fi
done
```

Or grep the raw log directly:

```bash
git log --format=fuller -20 | grep -i "co-authored"
```

If you find trailers on commits where you didn't use AI, you can rewrite recent history (before pushing) with `git rebase -i` and editing the commit messages, or amend the tip commit:

```bash
# Remove trailer from the latest commit (only if not yet pushed)
git commit --amend
# Then manually delete the Co-authored-by line in the editor
```

For already-pushed commits, the calculus changes — rewriting public history causes headaches for anyone who has pulled. At that point it's usually better to leave it and move on.

## Turning it off

In VS Code settings (`Cmd+,` or `Ctrl+,`), search for `git.addAICoAuthor` and set it to `"off"`. Or add it directly to your `settings.json`:

```json
{
  "git.addAICoAuthor": "off"
}
```

You can also scope this to a workspace if you want to keep it on for personal projects but off for work repos — put the setting in `.vscode/settings.json` in the workspace root.

If you're managing team settings, the VS Code remote/profile settings system can propagate this via `settings.json` committed to the repo.

## What I'd build with this

This episode surfaces a broader need: **commit hygiene tooling that's attribution-aware**.

A few things I'd actually build:

1. **A git hook that audits Co-authored-by trailers against actual diff content.** If a commit is 100% identical to what the developer staged (no AI suggestion was accepted), strip the trailer automatically at commit time. This requires integration with the editor's suggestion acceptance events, but VS Code's extension API exposes enough to make it feasible.

2. **A repo stats dashboard that breaks down AI-assisted vs human commits over time.** Not for surveillance — for your own retrospective. Useful data for writing a post-mortem on a sprint: "we leaned heavily on AI for the auth rewrite, less so for the frontend."

3. **A pre-push hook for teams with policy requirements.** Scan for `Co-authored-by: Copilot` on commits touching certain paths (e.g., anything in `src/compliance/` or `supabase/migrations/`) and warn the pusher to verify attribution before the push completes.

## My take

The underlying idea — recording AI involvement in the git history — is worth doing. I'd rather have that information in the commit than not. But opt-in is the only defensible default for something that modifies a permanent record. Changing a default to opt-out, silently, in a patch release, and having it fire when AI features are explicitly disabled, is the kind of thing that erodes trust in automatic tooling.

Check your recent commits. Set the preference explicitly either way. And don't assume that because a tool is trying to be helpful, it's being accurate.
