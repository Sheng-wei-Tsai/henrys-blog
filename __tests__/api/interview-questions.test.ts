import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ── Auth / subscription mocks ─────────────────────────────────────────────────
const mockRequireSubscription    = vi.fn();
const mockCheckEndpointRateLimit = vi.fn().mockResolvedValue(true);
const mockRecordUsage            = vi.fn();

vi.mock('@/lib/subscription', () => ({
  requireSubscription:    mockRequireSubscription,
  checkEndpointRateLimit: mockCheckEndpointRateLimit,
  recordUsage:            mockRecordUsage,
  rateLimitResponse: () =>
    new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    ),
}));

// ── KV mocks ──────────────────────────────────────────────────────────────────
const mockKvGet = vi.fn().mockResolvedValue(null);
const mockKvSet = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/kv', () => ({
  kvGet: mockKvGet,
  kvSet: mockKvSet,
}));

// ── Supabase mock ─────────────────────────────────────────────────────────────
const sbChain = {
  select:      vi.fn(),
  eq:          vi.fn(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsert:      vi.fn().mockResolvedValue({ error: null }),
};
sbChain.select.mockReturnValue(sbChain);
sbChain.eq.mockReturnValue(sbChain);

const mockFrom = vi.fn().mockReturnValue(sbChain);

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: mockFrom }),
}));

// ── OpenAI mock ───────────────────────────────────────────────────────────────
const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function MockOpenAI() {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

const { POST } = await import('@/app/api/interview/questions/route');

function makePost(body: object) {
  return new NextRequest('http://localhost/api/interview/questions', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const validAuth    = { user: { id: 'u1' } };
const fakeQuestions = [{ id: 'q1', text: 'What is async/await?', questionType: 'text' }];
const fakePayload   = JSON.stringify({ questions: fakeQuestions });

describe('POST /api/interview/questions', () => {
  afterEach(() => {
    mockRequireSubscription.mockReset();
    mockCheckEndpointRateLimit.mockResolvedValue(true);
    mockKvGet.mockResolvedValue(null);
    mockKvSet.mockResolvedValue(undefined);
    sbChain.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockCreate.mockReset();
    mockRecordUsage.mockReset();
  });

  it('passes auth failure through unchanged', async () => {
    mockRequireSubscription.mockResolvedValueOnce(
      NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    );
    const res = await POST(makePost({ roleId: 'software-engineer' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 when endpoint rate limit is exceeded', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockCheckEndpointRateLimit.mockResolvedValueOnce(false);
    const res = await POST(makePost({ roleId: 'software-engineer' }));
    expect(res.status).toBe(429);
  });

  it('returns 400 when roleId is missing', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    const res = await POST(makePost({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing roleid/i);
  });

  it('returns 400 for an unknown roleId', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    const res = await POST(makePost({ roleId: 'not-a-real-role-xyz' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown role/i);
  });

  it('returns hardcoded questions for the universal role without calling OpenAI', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    const res = await POST(makePost({ roleId: 'universal' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.questions)).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockKvGet).not.toHaveBeenCalled();
  });

  it('serves from KV cache without calling OpenAI or Supabase', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockKvGet.mockResolvedValueOnce(fakePayload);

    const res = await POST(makePost({ roleId: 'junior-frontend' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toEqual(fakeQuestions);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('records usage on a KV cache hit', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockKvGet.mockResolvedValueOnce(fakePayload);
    await POST(makePost({ roleId: 'junior-frontend' }));
    expect(mockRecordUsage).toHaveBeenCalledWith('u1', 'interview/questions');
  });

  it('falls back to Supabase when KV misses and warms KV', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockKvGet.mockResolvedValueOnce(null);
    sbChain.maybeSingle.mockResolvedValueOnce({ data: { questions: fakeQuestions }, error: null });

    const res = await POST(makePost({ roleId: 'junior-frontend' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toEqual(fakeQuestions);
    expect(mockCreate).not.toHaveBeenCalled();
    // KV should be warmed with the Supabase result
    expect(mockKvSet).toHaveBeenCalledWith(
      'interview-questions:junior-frontend',
      JSON.stringify({ questions: fakeQuestions }),
      expect.any(Number),
    );
  });

  it('generates fresh questions on a full cache miss and writes to both caches', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockKvGet.mockResolvedValueOnce(null);
    sbChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: fakePayload } }],
    });

    const res = await POST(makePost({ roleId: 'junior-frontend' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toEqual(fakeQuestions);
    // Both caches must be written
    expect(mockKvSet).toHaveBeenCalledWith(
      'interview-questions:junior-frontend',
      fakePayload,
      expect.any(Number),
    );
    expect(mockFrom).toHaveBeenCalledWith('interview_questions_cache');
  });

  it('returns 502 when OpenAI throws', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockCreate.mockRejectedValueOnce(new Error('upstream timeout'));

    const res = await POST(makePost({ roleId: 'junior-frontend' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/upstream timeout/i);
  });

  it('falls through corrupt KV entry to Supabase', async () => {
    mockRequireSubscription.mockResolvedValueOnce(validAuth);
    mockKvGet.mockResolvedValueOnce('not-valid-json{{{');
    sbChain.maybeSingle.mockResolvedValueOnce({ data: { questions: fakeQuestions }, error: null });

    const res = await POST(makePost({ roleId: 'junior-frontend' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toEqual(fakeQuestions);
  });
});
