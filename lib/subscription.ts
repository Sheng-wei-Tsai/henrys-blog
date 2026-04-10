/**
 * Subscription checking and rate limiting.
 * All functions run server-side only.
 */
import type { NextResponse }  from 'next/server';
import type { User }          from '@supabase/supabase-js';
import {
  createSupabaseServer,
  createSupabaseService,
  isOwner,
  unauthorizedResponse,
  subscriptionRequiredResponse,
  rateLimitResponse,
} from './auth-server';

// Re-export so route handlers only need one import from '@/lib/subscription'
export { rateLimitResponse } from './auth-server';

// Pro users: max AI calls per 24-hour rolling window (global across all endpoints)
const PRO_DAILY_LIMIT = 50;

// Per-endpoint daily limits — checked via checkEndpointRateLimit() in each route.
// Every route that calls an AI API must be registered here.
export const ENDPOINT_LIMITS: Record<string, number> = {
  // Claude (Anthropic) — most expensive
  'learn/analyse':      20,  // ~$0.035/call
  'resume-analyse':     10,  // ~$0.030/call (PDF vision)
  'resume-match':       30,  // ~$0.020/call

  // OpenAI (gpt-4o-mini) — cheaper, higher limits
  'interview/questions': 15, // generates 10 questions per call
  'interview/chat':      40, // conversational — frequent
  'interview/evaluate':  30, // per answer submission
  'interview/mentor':    30, // per mentor stage
  'cover-letter':        15, // relatively expensive prompt
  'learn/quiz':          25, // per video
};

// ── Subscription status ───────────────────────────────────────────────
interface SubStatus {
  active: boolean;
  tier: 'free' | 'pro' | 'admin';
}

export async function getSubscriptionStatus(userId: string): Promise<SubStatus> {
  const sb = createSupabaseService();
  const { data } = await sb
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single();

  if (!data) return { active: false, tier: 'free' };

  const tier = (data.subscription_tier ?? 'free') as SubStatus['tier'];

  if (tier === 'admin') return { active: true, tier: 'admin' };

  if (tier === 'pro') {
    const expires = data.subscription_expires_at;
    // No expiry = lifetime pro
    const active = !expires || new Date(expires) > new Date();
    return { active, tier: active ? 'pro' : 'free' };
  }

  return { active: false, tier: 'free' };
}

// ── Rate limit check (pro users only) ────────────────────────────────
export async function checkRateLimit(userId: string): Promise<boolean> {
  const sb = createSupabaseService();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await sb
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('called_at', since);
  return (count ?? 0) < PRO_DAILY_LIMIT;
}

// ── Per-endpoint rate limit (for expensive routes) ────────────────────
export async function checkEndpointRateLimit(userId: string, endpoint: string): Promise<boolean> {
  const limit = ENDPOINT_LIMITS[endpoint];
  if (!limit) return true;            // no per-endpoint limit defined
  const sb = createSupabaseService();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await sb
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('called_at', since);
  return (count ?? 0) < limit;
}

// ── Record a single API call ──────────────────────────────────────────
export async function recordUsage(userId: string, endpoint: string): Promise<void> {
  const sb = createSupabaseService();
  await sb.from('api_usage').insert({ user_id: userId, endpoint });
}

// ── requireSubscription ───────────────────────────────────────────────
// Use at the top of every paid AI route handler.
//
// Returns { user } if access is granted.
// Returns a NextResponse (401 / 403 / 429) if access is denied.
//
// Usage:
//   const result = await requireSubscription()
//   if (result instanceof NextResponse) return result
//   const { user } = result
//
export async function requireSubscription(): Promise<{ user: User } | NextResponse> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  // ── 1. Must be authenticated ─────────────────────────────────────
  if (!user) return unauthorizedResponse();

  // ── 2. Owner gets unlimited free access ─────────────────────────
  if (isOwner(user.email)) return { user };

  // ── 3. Check subscription ────────────────────────────────────────
  const sub = await getSubscriptionStatus(user.id);
  if (!sub.active) return subscriptionRequiredResponse();

  // ── 4. Rate limit for pro users ──────────────────────────────────
  const withinLimit = await checkRateLimit(user.id);
  if (!withinLimit) return rateLimitResponse();

  return { user };
}
