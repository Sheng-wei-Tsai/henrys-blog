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

// ── KV mock ───────────────────────────────────────────────────────────────────
const mockKvGet = vi.fn().mockResolvedValue(null);
const mockKvSet = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/kv', () => ({
  kvGet: (...args: unknown[]) => mockKvGet(...args),
  kvSet: (...args: unknown[]) => mockKvSet(...args),
}));

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpsert      = vi.fn().mockResolvedValue({ error: null });
const mockEq          = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect      = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom        = vi.fn().mockReturnValue({ select: mockSelect, upsert: mockUpsert });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: mockFrom }),
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
      mockKvGet.mockResolvedValue(null);
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
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

    it('returns cached text from KV without calling OpenAI', async () => {
      const cachedLetter = 'A'.repeat(200);
      mockKvGet.mockResolvedValueOnce(cachedLetter);
      const res = await POST(makePost(validBody));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/plain');
      expect(await res.text()).toBe(cachedLetter);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns cached text from Supabase on KV miss and populates KV', async () => {
      const cachedLetter = 'B'.repeat(200);
      mockKvGet.mockResolvedValueOnce(null);
      mockMaybeSingle.mockResolvedValueOnce({
        data: { cover_letter_text: cachedLetter },
        error: null,
      });
      const res = await POST(makePost(validBody));
      expect(res.status).toBe(200);
      expect(await res.text()).toBe(cachedLetter);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockKvSet).toHaveBeenCalledWith(
        expect.stringContaining('cover-letter-fragment:'),
        cachedLetter,
        expect.any(Number),
      );
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

    it('uses company+jobTitle as the cache key', async () => {
      mockCreate.mockResolvedValueOnce(makeStreamChunks(['ok']));
      await POST(makePost(validBody));
      expect(mockKvGet).toHaveBeenCalledWith(
        expect.stringMatching(/^cover-letter-fragment:atlassian:software-engineer$/),
      );
    });
  });
});
