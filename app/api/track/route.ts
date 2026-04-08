import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key so RLS insert policy applies correctly
// (anon insert works too, but service role avoids edge cases with JWT)
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, device, sessionId } = body;

    if (!path || !sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Country/city from Vercel edge headers (empty in local dev)
    const country = req.headers.get('x-vercel-ip-country') ?? null;
    const city    = req.headers.get('x-vercel-ip-city')    ?? null;

    // Normalise referrer: strip query strings and keep only the origin
    let cleanReferrer: string | null = null;
    if (referrer) {
      try {
        const url = new URL(referrer);
        // Mark same-site referrers as 'direct'
        const appHost = process.env.NEXT_PUBLIC_APP_URL
          ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
          : 'henrysdigitallife.com';
        cleanReferrer = url.host === appHost ? null : url.origin;
      } catch {
        cleanReferrer = null;
      }
    }

    // upsert — the UNIQUE index on (session_id, path, created_at::date)
    // means duplicates within the same day are silently ignored
    await sb.from('page_views').upsert(
      {
        path:       path.slice(0, 500),
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
