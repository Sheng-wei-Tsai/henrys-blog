#!/bin/bash
# Installs claude-window-watcher as a launchd LaunchAgent (runs on login, always-on).
# Run once: bash scripts/install-window-watcher.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCHER="$SCRIPT_DIR/claude-window-watcher.sh"
PLIST_SRC="$SCRIPT_DIR/../Library/LaunchAgents/com.henry.claude-window-watcher.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.henry.claude-window-watcher.plist"
LOG="$HOME/.claude/window-watcher.log"

chmod +x "$WATCHER"

# Substitute the real script path into the plist
sed "s|WATCHER_SCRIPT_PATH|${WATCHER}|g" "$PLIST_SRC" > "$PLIST_DEST"

# Unload any stale version first
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load the agent
launchctl load "$PLIST_DEST"

echo "✅ Window watcher installed and running."
echo "   Logs: $LOG"
echo "   Status: launchctl list com.henry.claude-window-watcher"
echo "   Stop:   launchctl unload $PLIST_DEST"
