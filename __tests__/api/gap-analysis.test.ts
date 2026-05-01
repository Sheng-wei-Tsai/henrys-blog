import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── Auth mocks ────────────────────────────────────────────────────────────────
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

// Service client chain used for cache lookup and upsert
const mockMaybySingle = vi.fn().mockResolvedValue({ data: null });
const mockUpsert      = vi.fn().mockResolvedValue({ error: null });
const svcChainable = {
  select:      vi.fn(),
  eq:          vi.fn(),
  gt:          vi.fn(),
  in:          vi.fn(),
  upsert:      mockUpsert,
  maybeSingle: mockMaybySingle,
};
(svcChainable.select as ReturnType<typeof vi.fn>).mockReturnValue(svcChainable);
(svcChainable.eq     as ReturnType<typeof vi.fn>).mockReturnValue(svcChainable);
(svcChainable.gt     as ReturnType<typeof vi.fn>).mockReturnValue(svcChainable);
(svcChainable.in     as ReturnType<typeof vi.fn>).mockReturnValue(svcChainable);

// Server client chain used for skill_progress query
const svrChainable = {
  select: vi.fn(),
  eq:     vi.fn(),
  in:     vi.fn(),
};
(svrChainable.select as ReturnType<typeof vi.fn>).mockReturnValue(svrChainable);
(svrChainable.eq     as ReturnType<typeof vi.fn>).mockReturnValue(svrChainable);
(svrChainable.in     as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

vi.mock('@/lib/auth-server', () => ({
  createSupabaseServer: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockReturnValue(svrChainable),
  }),
  createSupabaseService: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue(svcChainable),
  }),
}));

// ── Rate-limit mock ───────────────────────────────────────────────────────────
const mockCheckEndpointRateLimit = vi.fn().mockResolvedValue(true);

vi.mock('@/lib/subscription', () => ({
  checkEndpointRateLimit: mockCheckEndpointRateLimit,
  rateLimitResponse: () =>
    new Response(
      JSON.stringify({ error: 'Rate limit exceeded.', code: 'RATE_LIMIT_EXCEEDED' }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    ),
}));

// ── OpenAI mock ───────────────────────────────────────────────────────────────
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '["React","TypeScript"]' } }],
        }),
      },
    },
  })),
}));

const { POST } = await import('@/app/api/gap-analysis/route');

function makePost(body: object) {
  return new NextRequest('http://localhost/api/gap-analysis', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/gap-analysis', () => {
  it('returns 401 without session', async () => {
    const res = await POST(makePost({ jobId: 'j1', description: 'Build React apps' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 when daily cap of 5 calls is reached', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockCheckEndpointRateLimit.mockResolvedValueOnce(false);
    const res = await POST(makePost({ jobId: 'j1', description: 'Build React apps' }));
    expect(res.status).toBe(429);
  });

  it('returns cached result for a duplicate jobId within 7 days', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockCheckEndpointRateLimit.mockResolvedValueOnce(true);
    mockMaybySingle.mockResolvedValueOnce({
      data: {
        match_percent:     80,
        matched_skills:    ['React'],
        missing_skills:    [],
        all_jd_skills:     ['React', 'TypeScript'],
        recommended_paths: ['frontend'],
      },
    });

    const res  = await POST(makePost({ jobId: 'j1', description: 'Build React apps' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cached).toBe(true);
    expect(body.matchPercent).toBe(80);
    expect(body.jobId).toBe('j1');
  });
});
