#!/bin/bash
# Shows Claude Code Pro subscription usage and reset time.
# Run any time: bash scripts/claude-usage-status.sh
# Also sourced by claude-idle-trigger.sh and the scheduler guard.
#
# Data sources:
#   ~/.claude/.reset_notifier_state  — epoch of last quota reset (written by reset-notifier daemon)
#   ~/.claude/stats-cache.json       — cumulative daily token/message counts
#   ~/.claude/projects/**/*.jsonl    — live session logs (token counts per turn)

set -euo pipefail

RESET_STATE="$HOME/.claude/.reset_notifier_state"
STATS_CACHE="$HOME/.claude/stats-cache.json"
NOW=$(date +%s)
TODAY_UTC=$(date -u +%Y-%m-%d)
TODAY_LOCAL=$(date +%Y-%m-%d)

echo "╔══════════════════════════════════════════════╗"
echo "║      Claude Code Pro — Usage Status          ║"
printf "║  %-44s║\n" "$(date '+%Y-%m-%d %H:%M %Z')"
echo "╚══════════════════════════════════════════════╝"
echo

# ── Reset / quota window ──────────────────────────────────────────────────────
if [ -f "$RESET_STATE" ]; then
  RESET_EPOCH=$(tr -d '[:space:]' < "$RESET_STATE")
  if [ "$NOW" -lt "$RESET_EPOCH" ]; then
    SECS_LEFT=$(( RESET_EPOCH - NOW ))
    MINS_LEFT=$(( SECS_LEFT / 60 ))
    RESET_AT=$(date -r "$RESET_EPOCH" "+%Y-%m-%d %H:%M %Z" 2>/dev/null \
      || date -d "@$RESET_EPOCH" "+%Y-%m-%d %H:%M %Z" 2>/dev/null \
      || echo "epoch=$RESET_EPOCH")
    echo "🔴 RATE LIMITED — resets at: ${RESET_AT}"
    printf "   %d min remaining (%d:%02d)\n" "$MINS_LEFT" "$(( MINS_LEFT/60 ))" "$(( MINS_LEFT%60 ))"
  else
    SECS_SINCE=$(( NOW - RESET_EPOCH ))
    RESET_AT=$(date -r "$RESET_EPOCH" "+%Y-%m-%d %H:%M %Z" 2>/dev/null \
      || date -d "@$RESET_EPOCH" "+%Y-%m-%d %H:%M %Z" 2>/dev/null \
      || echo "epoch=$RESET_EPOCH")
    HRS=$(( SECS_SINCE / 3600 ))
    MINS=$(( (SECS_SINCE % 3600) / 60 ))
    echo "🟢 QUOTA AVAILABLE"
    echo "   Last reset: ${RESET_AT}"
    printf "   Window open for: %dh %dm\n" "$HRS" "$MINS"
    # Estimate next reset — Claude Pro typically has a 5-hour rolling window
    NEXT_EPOCH=$(( RESET_EPOCH + 5 * 3600 ))
    if [ "$NOW" -lt "$NEXT_EPOCH" ]; then
      SECS_TO_NEXT=$(( NEXT_EPOCH - NOW ))
      NEXT_AT=$(date -r "$NEXT_EPOCH" "+%H:%M %Z" 2>/dev/null \
        || date -d "@$NEXT_EPOCH" "+%H:%M %Z" 2>/dev/null \
        || echo "")
      printf "   Est. next limit: ~%s (%dh %dm)\n" \
        "$NEXT_AT" "$(( SECS_TO_NEXT/3600 ))" "$(( (SECS_TO_NEXT%3600)/60 ))"
    fi
  fi
else
  echo "⚪ Reset state file not found — usage unknown"
  echo "   (file: ~/.claude/.reset_notifier_state)"
fi
echo

# ── Today's token usage from live session logs ────────────────────────────────
echo "── Today's session usage (${TODAY_UTC} UTC) ──────────────────"
python3 - "$TODAY_UTC" "$HOME/.claude/projects" <<'PYEOF'
import sys, os, json, glob

target_date = sys.argv[1]
projects_dir = sys.argv[2]

total_input = 0
total_output = 0
total_cache_read = 0
total_cache_write = 0
total_messages = 0
models_used = set()

for jsonl in glob.glob(f"{projects_dir}/**/*.jsonl", recursive=True):
    try:
        with open(jsonl) as f:
            for line in f:
                try:
                    obj = json.loads(line.strip())
                    ts = obj.get('timestamp', '')
                    if not ts.startswith(target_date):
                        continue
                    # Count user turns
                    if obj.get('type') == 'user':
                        total_messages += 1
                    # Harvest usage from assistant message payloads
                    msg = obj.get('message', {})
                    if isinstance(msg, dict):
                        usage = msg.get('usage', {})
                        if usage:
                            total_input      += usage.get('input_tokens', 0)
                            total_output     += usage.get('output_tokens', 0)
                            total_cache_read += usage.get('cache_read_input_tokens', 0)
                            total_cache_write+= usage.get('cache_creation_input_tokens', 0)
                        model = msg.get('model', '')
                        if model:
                            models_used.add(model)
                except Exception:
                    pass
    except Exception:
        pass

if total_input + total_output == 0 and total_messages == 0:
    print("  No session data found for today yet.")
else:
    print(f"  User turns   : {total_messages}")
    print(f"  Input tokens : {total_input:,}")
    print(f"  Output tokens: {total_output:,}")
    if total_cache_read or total_cache_write:
        print(f"  Cache read   : {total_cache_read:,}")
        print(f"  Cache write  : {total_cache_write:,}")
    if models_used:
        print(f"  Models       : {', '.join(sorted(models_used))}")
PYEOF
echo

# ── Historical daily summary (from stats-cache) ───────────────────────────────
if [ -f "$STATS_CACHE" ]; then
  echo "── Recent daily history (stats-cache) ────────────────────────"
  python3 - "$STATS_CACHE" <<'PYEOF'
import sys, json
data = json.load(open(sys.argv[1]))
days   = {d['date']: d for d in data.get('dailyActivity', [])}
tokens = {d['date']: d for d in data.get('dailyModelTokens', [])}
all_dates = sorted(set(list(days.keys()) + list(tokens.keys())))[-7:]
for dt in all_dates:
    d = days.get(dt, {})
    t = tokens.get(dt, {}).get('tokensByModel', {})
    tok_str = ', '.join(f"{m.split('-')[1]}: {v:,}" for m, v in t.items()) if t else 'n/a'
    print(f"  {dt}: {d.get('messageCount',0):4d} msgs  {tok_str}")
last = data.get('lastComputedDate', '?')
print(f"\n  (cache last updated: {last} — run claude to refresh)")
PYEOF
fi
echo

# ── Autonomous loop status ────────────────────────────────────────────────────
echo "── Autonomous loop today ──────────────────────────────────────"
REPO="Sheng-wei-Tsai/henrys-blog"
if command -v gh &>/dev/null; then
  EXHAUSTED=$(gh api "repos/${REPO}/git/refs/heads/quota-exhausted/${TODAY_UTC}" \
    --silent 2>/dev/null && echo "yes" || echo "no")
  ANALYSIS=$(gh api "repos/${REPO}/git/refs/heads/analysis/${TODAY_UTC}" \
    --silent 2>/dev/null && echo "yes" || echo "no")
  # Count quota windows used today
  WIN_COUNT=$(gh api "repos/${REPO}/git/refs/heads" \
    --jq "[.[] | select(.ref | startswith(\"refs/heads/dev-done/${TODAY_UTC}-w\"))] | length" \
    --silent 2>/dev/null || echo "?")
  echo "  quota-exhausted/${TODAY_UTC}: ${EXHAUSTED}"
  echo "  analysis/${TODAY_UTC}:        ${ANALYSIS}"
  echo "  dev-done windows today:      ${WIN_COUNT}/4"
  IDLE_PID_FILE="$HOME/.claude/idle-trigger-henrys-blog.pid"
  if [ -f "$IDLE_PID_FILE" ]; then
    IDLE_PID=$(cat "$IDLE_PID_FILE")
    if kill -0 "$IDLE_PID" 2>/dev/null; then
      echo "  idle-trigger: RUNNING (pid $IDLE_PID — fires in ≤60 min if no new session)"
    else
      echo "  idle-trigger: stale pid file (not running)"
    fi
  else
    echo "  idle-trigger: not running"
  fi
  WATCHER_LOG="$HOME/.claude/window-watcher.log"
  if [ -f "$WATCHER_LOG" ]; then
    LAST_LINE=$(tail -1 "$WATCHER_LOG")
    echo "  window-watcher: ${LAST_LINE}"
  else
    echo "  window-watcher: not installed (run: bash scripts/install-window-watcher.sh)"
  fi
else
  echo "  gh CLI not found — cannot check sentinel branches"
fi
echo
