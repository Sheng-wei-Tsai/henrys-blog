'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getOrCreateSessionId(): string {
  const key = 'hd_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function getDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin pages — no need to track admin activity
    if (pathname.startsWith('/admin')) return;

    const sessionId = getOrCreateSessionId();
    const device = getDevice();
    const referrer = document.referrer || null;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer, device, sessionId }),
      // fire-and-forget — don't block rendering
      keepalive: true,
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
