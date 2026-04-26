#!/bin/bash
# Runs in background when a Claude Code session ends in this project.
# Two-phase dispatch using Claude Code Pro quota (no ANTHROPIC_API_KEY):
#
#   60 min idle → dispatch autonomous-loop.yml (Opus analyse → Sonnet implement)
#   90 min idle → dispatch idle-posts.yml (generate today's blog post)
#
# Both cancelled by scripts/claude-cancel-trigger.sh when user returns.
#
# Guards before dispatching:
#   1. Quota not already exhausted today (quota-exhausted/<date> sentinel branch)
#   2. Loop not already ran today (analysis/<date> sentinel branch)
#   3. Past the 14:00 UTC Pro subscription reset window (avoids firing mid-quota)

REPO="Sheng-wei-Tsai/henrys-blog"
PID_FILE="$HOME/.claude/idle-trigger-henrys-blog.pid"
LOG="$HOME/.claude/idle-trigger.log"
IDLE_MINUTES=60

echo $$ > "$PID_FILE"

sleep $(( IDLE_MINUTES * 60 ))

# Still alive? User was idle for 60 min. Run guards before dispatching.
if [ -f "$PID_FILE" ] && [ "$(cat "$PID_FILE")" = "$$" ]; then
  TODAY=$(date -u +%Y-%m-%d)

  # Guard 1: skip if reset epoch is in the future (still within the rate-limited window)
  RESET_STATE="$HOME/.claude/.reset_notifier_state"
  if [ -f "$RESET_STATE" ]; then
    RESET_EPOCH=$(tr -d '[:space:]' < "$RESET_STATE")
    NOW_EPOCH=$(date +%s)
    if [ "$NOW_EPOCH" -lt "$RESET_EPOCH" ]; then
      RESET_AT=$(date -r "$RESET_EPOCH" "+%Y-%m-%d %H:%M %Z" 2>/dev/null || date -d "@$RESET_EPOCH" "+%Y-%m-%d %H:%M %Z" 2>/dev/null || echo "epoch=$RESET_EPOCH")
      echo "[idle-trigger $(date -u)] Quota resets at ${RESET_AT} — still rate-limited, skipping" >> "$LOG"
      rm -f "$PID_FILE"
      exit 0
    fi
  fi

  # Guard 2: skip if quota already exhausted today
  EXHAUSTED=$(gh api "repos/${REPO}/git/refs/heads/quota-exhausted/${TODAY}" \
    --silent 2>/dev/null && echo "1" || echo "0")
  if [ "$EXHAUSTED" = "1" ]; then
    echo "[idle-trigger $(date -u)] Quota exhausted today — skipping dispatch" >> "$LOG"
    rm -f "$PID_FILE"
    exit 0
  fi

  # Guard 3: skip autonomous loop if already ran today (posts still fire in phase 2)
  ANALYSIS=$(gh api "repos/${REPO}/git/refs/heads/analysis/${TODAY}" \
    --silent 2>/dev/null && echo "1" || echo "0")
  if [ "$ANALYSIS" = "1" ]; then
    echo "[idle-trigger $(date -u)] Loop already ran today — skipping loop dispatch, still waiting for post phase" >> "$LOG"
  else
    # All clear — dispatch autonomous loop
    SESSION_ID="idle-$(date -u +%Y%m%dT%H%M)"
    echo "[idle-trigger $(date -u)] Dispatching autonomous loop session=${SESSION_ID}" >> "$LOG"
    gh workflow run autonomous-loop.yml \
      --repo "$REPO" \
      --field iteration=1 \
      --field session_id="$SESSION_ID" \
      >> "$LOG" 2>&1
  fi

  # Phase 2: wait 30 more minutes then dispatch daily post (uses Pro quota)
  sleep 1800

  if [ -f "$PID_FILE" ] && [ "$(cat "$PID_FILE")" = "$$" ]; then
    TODAY2=$(date -u +%Y-%m-%d)

    # Guard: skip if today's post already exists (autonomous loop may have created it)
    POST_COUNT=$(gh api "repos/${REPO}/git/trees/main" --jq '.tree[] | select(.path == "content/posts") | .sha' --silent 2>/dev/null | \
      xargs -I{} gh api "repos/${REPO}/git/trees/{}" --jq "[.tree[].path | select(startswith(\"${TODAY2}\"))] | length" --silent 2>/dev/null || echo "0")
    if [ "${POST_COUNT:-0}" -gt "0" ]; then
      echo "[idle-trigger $(date -u)] Post for ${TODAY2} already exists — skipping idle-posts dispatch" >> "$LOG"
      rm -f "$PID_FILE"
      exit 0
    fi

    echo "[idle-trigger $(date -u)] Dispatching idle-posts for ${TODAY2}" >> "$LOG"
    gh workflow run idle-posts.yml \
      --repo "$REPO" \
      >> "$LOG" 2>&1
    rm -f "$PID_FILE"
  fi
fi
