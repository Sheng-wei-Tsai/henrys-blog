import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ── Subscription mock ─────────────────────────────────────────────────────────
const mockRequireSubscription = vi.fn();

vi.mock('@/lib/subscription', () => ({
  requireSubscription:     mockRequireSubscription,
  checkEndpointRateLimit:  vi.fn().mockResolvedValue(true),
  rateLimitResponse: () =>
    new Response(
      JSON.stringify({ error: 'Rate limit exceeded.', code: 'RATE_LIMIT_EXCEEDED' }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    ),
  recordUsage: vi.fn(),
}));

// ── OpenAI mock ───────────────────────────────────────────────────────────────
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

const { POST } = await import('@/app/api/cover-letter/route');

function makePost(body: object) {
  return new NextRequest('http://localhost/api/cover-letter', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const validBody = {
  jobTitle:       'Software Engineer',
  company:        'Atlassian',
  jobDescription: 'Build great software.',
  background:     '3 years React experience.',
};

describe('POST /api/cover-letter', () => {
  it('returns 401 without session', async () => {
    mockRequireSubscription.mockResolvedValueOnce(
      NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 },
      ),
    );
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 403 SUBSCRIPTION_REQUIRED without active plan', async () => {
    mockRequireSubscription.mockResolvedValueOnce(
      NextResponse.json(
        { error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 },
      ),
    );
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('SUBSCRIPTION_REQUIRED');
  });
});
