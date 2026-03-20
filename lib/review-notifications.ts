const STORAGE_KEY = 'skill_review_schedule';

interface ReviewEntry {
  skillName: string;
  pathId:    string;
  skillId:   string;
  remindAt:  string[]; // ISO strings, e.g. [day+3, day+7]
}

function load(): Record<string, ReviewEntry> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function save(s: Record<string, ReviewEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** Call when a skill is marked as learned. Saves review dates to localStorage. */
export function scheduleReview(pathId: string, skillId: string, skillName: string) {
  const all = load();
  all[`${pathId}:${skillId}`] = {
    skillName, pathId, skillId,
    remindAt: [addDays(3), addDays(7)],
  };
  save(all);
}

/** Remove from schedule (when skill is reset). */
export function clearReview(pathId: string, skillId: string) {
  const all = load();
  delete all[`${pathId}:${skillId}`];
  save(all);
}

/** Request notification permission (call on first user interaction). */
export async function requestPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Check localStorage for due reviews and fire browser notifications.
 * Call on page mount. Notifications appear in macOS notification centre.
 */
export function fireIfDue() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const all = load();
  const now = new Date();

  Object.entries(all).forEach(([key, entry]) => {
    const due   = entry.remindAt.filter(d => new Date(d) <= now);
    const ahead = entry.remindAt.filter(d => new Date(d) > now);

    if (due.length === 0) return;

    new Notification(`Review: ${entry.skillName}`, {
      body: due.length === 1 && entry.remindAt.length === 2
        ? "3-day check-in — spend 10 minutes revisiting this concept."
        : "7-day check-in — can you explain this without looking it up?",
      icon: '/favicon.ico',
      tag:  key,
    });

    // Keep upcoming reminders, remove fired ones
    if (ahead.length > 0) {
      all[key] = { ...entry, remindAt: ahead };
    } else {
      delete all[key];
    }
  });

  save(all);
}

/** Returns how many reviews are scheduled (for UI badge). */
export function getScheduledCount(): number {
  return Object.keys(load()).length;
}
