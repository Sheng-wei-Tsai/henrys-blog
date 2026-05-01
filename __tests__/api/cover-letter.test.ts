import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ── Subscription mock ─────────────────────────────────────────────────────────
const mockRequireSubscription = vi.fn();
const mockCheckEndpointRateLimit = vi.fn().mockResolvedValue(true);

vi.mock('@/lib/subscription', () => ({
  requireSubscription:     mockRequireSubscription,
  checkEndpointRateLimit:  mockCheckEndpointRateLimit,
  rateLimitResponse: () =>
    new Response(
      JSON.stringify({ error: 'Rate limit exceeded.', code: 'RATE_LIMIT_EXCEEDED' }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    ),
  recordUsage: vi.fn(),
}));

// ── OpenAI mock ───────────────────────────────────────────────────────────────
const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function MockOpenAI() {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  }),
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

const validAuth = { user: { id: 'u1' } };

async function* makeStreamChunks(chunks: string[]) {
  for (const text of chunks) {
    yield { choices: [{ delta: { content: text } }] };
  }
}

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

  describe('authenticated requests', () => {
    beforeEach(() => {
      mockRequireSubscription.mockResolvedValue(validAuth);
      mockCheckEndpointRateLimit.mockResolvedValue(true);
    });

    it('returns 429 when endpoint rate limit is reached', async () => {
      mockCheckEndpointRateLimit.mockResolvedValueOnce(false);
      const res = await POST(makePost(validBody));
      expect(res.status).toBe(429);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await POST(makePost({ jobTitle: 'Engineer' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for an unparseable request body', async () => {
      const req = new NextRequest('http://localhost/api/cover-letter', {
        method:  'POST',
        body:    'not-json',
        headers: { 'content-type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('streams plain-text content for a valid request', async () => {
      mockCreate.mockResolvedValueOnce(makeStreamChunks(['Dear Hiring', ' Manager,', ' Hello.']));
      const res = await POST(makePost(validBody));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/plain');
      const text = await res.text();
      expect(text).toBe('Dear Hiring Manager, Hello.');
    });

    it('truncates jobDescription to 3000 chars and background to 1500 chars', async () => {
      let capturedUserContent = '';
      mockCreate.mockImplementationOnce(
        async (opts: { messages: { role: string; content: string }[] }) => {
          capturedUserContent = opts.messages.find(m => m.role === 'user')?.content ?? '';
          return makeStreamChunks(['ok']);
        },
      );

      // Use chars that don't appear elsewhere in the prompt template
      await POST(makePost({
        ...validBody,
        jobDescription: 'q'.repeat(4000),
        background:     'z'.repeat(2000),
      }));

      // Truncated to 3000 — the 3000-char string is present but 3001 is not
      expect(capturedUserContent).toContain('q'.repeat(3000));
      expect(capturedUserContent).not.toContain('q'.repeat(3001));
      // Truncated to 1500
      expect(capturedUserContent).toContain('z'.repeat(1500));
      expect(capturedUserContent).not.toContain('z'.repeat(1501));
    });
  });
});
