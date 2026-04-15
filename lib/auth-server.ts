/**
 * Server-side auth utilities.
 * Import ONLY in Server Components, Route Handlers, and middleware.
 * Never import in 'use client' files.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient }       from '@supabase/supabase-js';
import { cookies }            from 'next/headers';
import { NextResponse }       from 'next/server';
import type { User }          from '@supabase/supabase-js';

// ── Owner email is read from env — never exposed to the browser ───────
// Deliberately NO hardcoded fallback: if OWNER_EMAIL is unset, isOwner()
// returns false for every address (fail-closed), preventing accidental
// admin access in misconfigured deployments.
const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase() ?? '';

// ── Supabase SSR client (reads session from request cookies) ──────────
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},   // read-only in route handlers
      },
    },
  );
}

// ── Service-role client — bypasses RLS for subscription + usage writes ─
export function createSupabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── Returns the validated server-side user (or null) ─────────────────
export async function getServerUser(): Promise<User | null> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user ?? null;
}

// ── True only when the email matches the platform owner ───────────────
export function isOwner(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL;
}

// ── Standard 401 JSON response ────────────────────────────────────────
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Authentication required', code: 'UNAUTHENTICATED' },
    { status: 401 },
  );
}

// ── Standard 403 JSON response ────────────────────────────────────────
export function subscriptionRequiredResponse() {
  return NextResponse.json(
    { error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' },
    { status: 403 },
  );
}

// ── Standard 429 JSON response ────────────────────────────────────────
export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Try again tomorrow.', code: 'RATE_LIMIT_EXCEEDED' },
    { status: 429 },
  );
}
