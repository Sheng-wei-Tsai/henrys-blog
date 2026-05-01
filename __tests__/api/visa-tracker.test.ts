import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockSingle  = vi.fn().mockResolvedValue({ data: null });
const mockUpsert  = vi.fn().mockResolvedValue({ error: null });

const chainable: Record<string, unknown> = {
  select: vi.fn(),
  eq:     vi.fn(),
  single: mockSingle,
  upsert: mockUpsert,
};
(chainable.select as ReturnType<typeof vi.fn>).mockReturnValue(chainable);
(chainable.eq     as ReturnType<typeof vi.fn>).mockReturnValue(chainable);

const mockFrom = vi.fn().mockReturnValue(chainable);

vi.mock('@/lib/auth-server', () => ({
  createSupabaseServer: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from:  mockFrom,
  }),
}));

const { GET, POST } = await import('@/app/api/visa-tracker/route');

function makePost(body: object) {
  return new NextRequest('http://localhost/api/visa-tracker', {
    method: 'POST',
    body:    JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('GET /api/visa-tracker', () => {
  it('returns 401 without auth', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('POST /api/visa-tracker', () => {
  it('returns 401 without auth', async () => {
    const res = await POST(makePost({}));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid started_at format', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makePost({ started_at: '01-15-2025' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/started_at/i);
  });

  it('returns 200 for valid payload', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makePost({ employer: 'Atlassian', occupation: 'Software Engineer', started_at: '2024-01-15' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('truncates employer and occupation to 100 chars', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const longString = 'X'.repeat(150);
    await POST(makePost({ employer: longString, occupation: longString }));
    const upsertArg = (mockUpsert.mock.calls.at(-1) as [Record<string, unknown>])[0];
    expect((upsertArg.employer as string).length).toBe(100);
    expect((upsertArg.occupation as string).length).toBe(100);
  });
});
