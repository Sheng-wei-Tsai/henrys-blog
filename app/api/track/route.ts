import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── In-memory IP rate limiter — max 60 events per IP per minute ──────────────
// Resets on cold start (serverless). Good enough to block naive spam.
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const window = 60_000; // 1 minute
  const limit  = 60;

  const entry = ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + window });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

// ── sessionId must be a 64-char hex or UUID-like string ──────────────────────
const SESSION_RE = /^[a-f0-9-]{32,64}$/i;

export async function POST(req: NextRequest) {
  try {
    // IP from Vercel edge header; fall back to a placeholder in local dev
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json();
    const { path, referrer, device, sessionId } = body;

    // Validate required fields + sessionId format
    if (!path || !sessionId || !SESSION_RE.test(sessionId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Sanitise path — must start with /
    const cleanPath = typeof path === 'string' && path.startsWith('/')
      ? path.slice(0, 500)
      : null;
    if (!cleanPath) return NextResponse.json({ ok: false }, { status: 400 });

    const country = req.headers.get('x-vercel-ip-country') ?? null;
    const city    = req.headers.get('x-vercel-ip-city')    ?? null;

    let cleanReferrer: string | null = null;
    if (referrer) {
      try {
        const url     = new URL(referrer);
        const appHost = process.env.NEXT_PUBLIC_APP_URL
          ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
          : 'henrysdigitallife.com';
        cleanReferrer = url.host === appHost ? null : url.origin;
      } catch {
        cleanReferrer = null;
      }
    }

    await sb.from('page_views').upsert(
      {
        path:       cleanPath,
        referrer:   cleanReferrer,
        country,
        city,
        device:     ['mobile', 'tablet', 'desktop'].includes(device) ? device : 'desktop',
        session_id: sessionId.slice(0, 64),
      },
      { onConflict: 'session_id,path', ignoreDuplicates: true },
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface errors to the client — tracking failures are silent
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
