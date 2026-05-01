import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ── Auth / subscription mocks ─────────────────────────────────────────────────
const mockRequireSubscription    = vi.fn();
const mockCheckEndpointRateLimit = vi.fn().mockResolvedValue(true);

vi.mock('@/lib/subscription', () => ({
  requireSubscription:    mockRequireSubscription,
  checkEndpointRateLimit: mockCheckEndpointRateLimit,
  recordUsage:            vi.fn(),
}));

vi.mock('@/lib/auth-server', () => ({
  rateLimitResponse: () =>
    new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    ),
}));

// ── Supabase mock — cache always misses ───────────────────────────────────────
const sbChain = {
  select:      vi.fn(),
  eq:          vi.fn(),
  single:      vi.fn().mockResolvedValue({ data: null, error: null }),
};
sbChain.select.mockReturnValue(sbChain);
sbChain.eq.mockReturnValue(sbChain);

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue(sbChain) }),
}));

// ── Gemini mock ───────────────────────────────────────────────────────────────
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function MockGemini() {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContentStream: vi.fn().mockResolvedValue({
          stream: (async function* () { yield { text: () => '{}' }; })(),
        }),
      }),
    };
  }),
}));

const { POST } = await import('@/app/api/learn/analyse/route');

function makePost(body: object) {
  return new NextRequest('http://localhost/api/learn/analyse', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const validAuth = { user: { id: 'u1' } };

describe('POST /api/learn/analyse', () => {
  afterEach(() => {
    mockRequireSubscription.mockReset();
    mockCheckEndpointRateLimit.mockResolvedValue(true);
    delete process.env.GEMINI_API_KEY;
  });

  it('passes auth failure through unchanged', async () => {
    mockRequireSubscription.mockResolvedValueOnce(
      NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    );
    const res = await POST(makePost({ videoId: 'abc1234defg', videoTitle: 'Test' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when videoId is missing', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    const res = await POST(makePost({ videoTitle: 'Test Video' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 when video duration exceeds 2 hours', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    const res = await POST(makePost({
      videoId:         'abc1234defg',
      videoTitle:      'Very Long Conference Talk',
      durationSeconds: 8000,
    }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/2 hours/i);
  });

  it('does not block a video at exactly 2 hours (7200s is the boundary)', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    // 7200 is not > 7200, so no 422 — route proceeds to API key check → 503
    const res = await POST(makePost({
      videoId:         'abc1234defg',
      videoTitle:      'Two Hour Tutorial',
      durationSeconds: 7200,
    }));
    expect(res.status).not.toBe(422);
  });

  it('returns 503 when Gemini API key is not configured', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    const res = await POST(makePost({ videoId: 'abc1234defg', videoTitle: 'Test Video' }));
    expect(res.status).toBe(503);
  });

  it('returns 429 when endpoint rate limit is exceeded', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockCheckEndpointRateLimit.mockResolvedValueOnce(false);
    const res = await POST(makePost({ videoId: 'abc1234defg', videoTitle: 'Test' }));
    expect(res.status).toBe(429);
  });
});
