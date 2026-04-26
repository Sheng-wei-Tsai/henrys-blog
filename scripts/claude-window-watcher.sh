#!/bin/bash
# Runs as a launchd LaunchAgent (always-on daemon on user's Mac).
# Wakes at each Pro quota-window reset (~every 5 hours) and dispatches
# the autonomous loop if the user is idle — harvesting spare quota
# that would otherwise go unused mid-day or overnight.
#
# Complements claude-idle-trigger.sh:
#   idle-trigger  → fires 60 min after user *ends* a Claude session
#   window-watcher → fires when a new 5-hour window opens while user is idle
#
# Install: bash scripts/install-window-watcher.sh
# Logs:    ~/.claude/window-watcher.log

REPO="Sheng-wei-Tsai/henrys-blog"
RESET_STATE="$HOME/.claude/.reset_notifier_state"

# launchd has a minimal PATH — use explicit paths for Homebrew tools
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
IDLE_PID_FILE="$HOME/.claude/idle-trigger-henrys-blog.pid"
LAST_DISPATCH_FILE="$HOME/.claude/window-watcher-last-dispatch"
LOG="$HOME/.claude/window-watcher.log"
MAX_WINDOWS=4
WINDOW_SECS=18000   # 5-hour rolling window

log() {
  echo "[window-watcher $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" >> "$LOG"
}

dispatch_window() {
  local TODAY NOW RESET_EPOCH EXHAUSTED WIN_COUNT WINDOW SESSION_ID

  TODAY=$(date -u +%Y-%m-%d)
  NOW=$(date +%s)

  # Guard 1: still rate-limited
  if [ -f "$RESET_STATE" ]; then
    RESET_EPOCH=$(tr -d '[:space:]' < "$RESET_STATE")
    if [ "$NOW" -lt "$RESET_EPOCH" ]; then
      RESET_AT=$(date -r "$RESET_EPOCH" "+%H:%M %Z" 2>/dev/null \
        || date -d "@$RESET_EPOCH" "+%H:%M %Z" 2>/dev/null \
        || echo "epoch=$RESET_EPOCH")
      log "Still rate-limited (resets ${RESET_AT}) — skipping"
      return
    fi
  fi

  # Guard 2: quota exhausted today
  EXHAUSTED=$(gh api "repos/${REPO}/git/refs/heads/quota-exhausted/${TODAY}" \
    --silent 2>/dev/null && echo "1" || echo "0")
  if [ "$EXHAUSTED" = "1" ]; then
    log "Quota exhausted today — skipping"
    return
  fi

  # Guard 3: user actively in Claude session (idle-trigger pid alive = session open)
  if [ -f "$IDLE_PID_FILE" ]; then
    IDLE_PID=$(cat "$IDLE_PID_FILE")
    if kill -0 "$IDLE_PID" 2>/dev/null; then
      log "User in active Claude session (idle-trigger pid=${IDLE_PID}) — skipping"
      return
    fi
  fi

  # Guard 4: already at max windows for today
  WIN_COUNT=$(gh api "repos/${REPO}/git/refs/heads" \
    --jq "[.[] | select(.ref | startswith(\"refs/heads/dev-done/${TODAY}-w\"))] | length" \
    --silent 2>/dev/null || echo "0")
  if [ "${WIN_COUNT:-0}" -ge "$MAX_WINDOWS" ]; then
    log "All ${MAX_WINDOWS} windows used today (${TODAY}) — done until UTC midnight"
    return
  fi

  WINDOW=$((WIN_COUNT + 1))
  SESSION_ID="window-$(date -u +%Y%m%dT%H%M)"

  log "Dispatching autonomous-loop window ${WINDOW}/${MAX_WINDOWS} session=${SESSION_ID}"
  gh workflow run autonomous-loop.yml \
    --repo "$REPO" \
    --ref main \
    --field iteration=1 \
    --field session_id="$SESSION_ID" \
    --field window="${WINDOW}" \
    >> "$LOG" 2>&1 && log "Dispatch OK" || log "Dispatch FAILED — check gh auth"
}

# ── Main loop ─────────────────────────────────────────────────────────────────
log "Window watcher started (pid=$$, max_windows=${MAX_WINDOWS}, window_secs=${WINDOW_SECS})"

while true; do
  NOW=$(date +%s)

  if [ ! -f "$RESET_STATE" ]; then
    # No reset state yet — poll every 30 min until the daemon writes it
    log "No reset state file yet — sleeping 30 min"
    sleep 1800
    continue
  fi

  RESET_EPOCH=$(tr -d '[:space:]' < "$RESET_STATE")

  if [ "$NOW" -lt "$RESET_EPOCH" ]; then
    # Currently rate-limited — sleep until quota resets (+2 min buffer)
    SECS_TO_RESET=$(( RESET_EPOCH - NOW + 120 ))
    RESET_AT=$(date -r "$RESET_EPOCH" "+%H:%M %Z" 2>/dev/null \
      || date -d "@$RESET_EPOCH" "+%H:%M %Z" 2>/dev/null \
      || echo "epoch=$RESET_EPOCH")
    log "Rate-limited. Sleeping until reset at ${RESET_AT} (${SECS_TO_RESET}s)"
    sleep "$SECS_TO_RESET"
    continue
  fi

  # Quota is available. Check if we already dispatched for this reset epoch.
  LAST_EPOCH=0
  [ -f "$LAST_DISPATCH_FILE" ] && LAST_EPOCH=$(tr -d '[:space:]' < "$LAST_DISPATCH_FILE")

  if [ "$RESET_EPOCH" -gt "$LAST_EPOCH" ]; then
    # New window opened that we haven't dispatched for yet
    dispatch_window
    # Record that we handled this reset epoch (regardless of dispatch outcome)
    echo "$RESET_EPOCH" > "$LAST_DISPATCH_FILE"
    # Sleep ~5 hours before checking for the next window
    log "Sleeping ${WINDOW_SECS}s until next window check"
    sleep "$WINDOW_SECS"
  else
    # Already dispatched for this window — poll every 30 min in case RESET_STATE
    # updates sooner than expected (user starts a new session and hits limit again)
    sleep 1800
  fi
done
