/**
 * Thin wrapper over the Vercel KV (Upstash Redis) REST API.
 * Gracefully no-ops when KV_REST_API_URL / KV_REST_API_TOKEN are absent,
 * so the app works without KV configured (Supabase is the fallback).
 */

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

interface UpstashGetResponse { result: string | null }
interface UpstashPipelineResponse { result: string }

export async function kvGet(key: string): Promise<string | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json() as UpstashGetResponse;
    return body.result ?? null;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: string, ttlSeconds = 86_400): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['SET', key, value, 'EX', String(ttlSeconds)]]),
    }) as unknown as UpstashPipelineResponse[];
  } catch {
    // best-effort — KV write failure must not break the caller
  }
}
