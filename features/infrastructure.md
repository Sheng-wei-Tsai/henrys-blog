# Feature: Infrastructure & DevOps

**Priority:** 🟡 Medium (alerting, Dependabot) · 🟢 Nice to have (.env.example, security fix)
**Status:** 🔲 Not started
**Branch:** `chore/infrastructure` (create when starting)
**Started:** —
**Shipped:** —

---

## Goal

Add pipeline failure alerting so broken daily posts are caught immediately, configure Dependabot for automated dependency updates, and add an `.env.example` for easier onboarding.

---

## Acceptance Criteria

### Pipeline Failure Alerting (Medium)
- [ ] GitHub Actions daily post workflow sends a Discord webhook (or email) on failure
- [ ] Alert includes: workflow name, failure reason, link to the failing run
- [ ] `DISCORD_WEBHOOK_URL` (or equivalent) added to GitHub Secrets

### Dependabot (Medium)
- [ ] `.github/dependabot.yml` created with npm ecosystem config
- [ ] Weekly schedule — not daily (reduces noise)
- [ ] Auto-assigns PRs to Henry

### `.env.example` (Nice to have)
- [ ] `.env.example` file lists all required env vars with placeholder values
- [ ] Each var has a comment explaining where to get the value
- [ ] No real secrets included — placeholders only

### Moderate Security Alert Fix (Nice to have)
- [ ] 1 Dependabot moderate alert on the repo is investigated
- [ ] Upgraded or mitigated — do not suppress without understanding the risk

---

## Affected Files

| File | Action | Notes |
|------|--------|-------|
| `.github/workflows/daily-posts.yml` | Modify | Add failure notification step |
| `.github/dependabot.yml` | Create | Weekly npm dependency updates |
| `.env.example` | Create | All env vars listed — no real values |

---

## Implementation Notes

- Failure notification: use `actions/github-script` or `curl` to POST to Discord webhook
- Dependabot YAML: minimal config — see GitHub docs for `package-ecosystem: "npm"`
- `.env.example`: derive from the list in `CLAUDE.md` Environment Variables section
- Do NOT touch `.github/workflows/` files for any reason other than this feature
- Check the security alert on the GitHub repo page before fixing — understand what package is affected

---

## Senior Dev Test Checklist

### Functional

- [ ] Trigger a deliberate GitHub Actions failure (e.g. pass a bad script arg) — Discord alert received
- [ ] Alert message is readable and includes a link to the run
- [ ] Dependabot PR created within a week of merging `.github/dependabot.yml`
- [ ] `.env.example` includes every key listed in `CLAUDE.md`

### Build & Types

- [ ] `npm run build` unaffected by infrastructure changes
- [ ] `.github/workflows/daily-posts.yml` YAML is valid (check with `act` or GitHub UI)

### Security

- [ ] `.env.example` contains zero real API keys
- [ ] `DISCORD_WEBHOOK_URL` stored in GitHub Secrets — not hardcoded in workflow YAML
- [ ] Security alert dependency upgraded to a non-vulnerable version (verify CVE is fixed)

---

## Post-Ship Checklist

- [ ] Discord alert tested on live GitHub Actions run
- [ ] `.env.example` visible in repo root on GitHub
- [ ] Dependabot configured and visible in repo Insights → Dependency graph
- [ ] `context/feature-roadmap.md` items checked off
- [ ] This file updated with ship date

---

## Notes / History

- **—** — Not started yet
