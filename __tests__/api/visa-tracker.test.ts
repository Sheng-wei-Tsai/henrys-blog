import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Chain mocks for Supabase query builder used in this route:
// GET:  sb.from().select().eq().single()
// POST: sb.from().upsert()
const mockSingle  = vi.fn().mockResolvedValue({ data: null, error: null });
const mockEq      = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect  = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpsert  = vi.fn().mockResolvedValue({ error: null });
const mockFrom    = vi.fn().mockReturnValue({ select: mockSelect, upsert: mockUpsert });
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

// The route creates its own client via createServerClient from @supabase/ssr,
// so mock that package rather than lib/auth-server.
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

const { GET, POST } = await import('@/app/api/visa-tracker/route');

function makePostRequest(body: object) {
  return new NextRequest('http://localhost/api/visa-tracker', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  mockUpsert.mockClear();
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
});

describe('GET /api/visa-tracker', () => {
  it('returns 401 without auth', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns tracker data for authenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockSingle.mockResolvedValueOnce({
      data: { employer: 'Atlassian', occupation: 'Engineer', started_at: '2025-01-01', steps: {} },
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.employer).toBe('Atlassian');
  });

  it('returns empty defaults when no tracker row exists', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.employer).toBe('');
  });
});

describe('POST /api/visa-tracker', () => {
  it('returns 401 without auth', async () => {
    const res = await POST(makePostRequest({ employer: 'Atlassian' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid started_at format', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makePostRequest({ started_at: 'not-a-date' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/started_at/i);
  });

  it('returns 400 on malformed JSON body', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const req = new NextRequest('http://localhost/api/visa-tracker', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid data', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makePostRequest({
      employer: 'Atlassian',
      occupation: 'Software Engineer',
      started_at: '2025-01-01',
      steps: { step1: true },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('truncates oversized employer and occupation to 100 chars', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const longString = 'A'.repeat(200);
    const res = await POST(makePostRequest({ employer: longString, occupation: longString }));
    expect(res.status).toBe(200);
    const upsertArg = mockUpsert.mock.calls[0]?.[0] as Record<string, string>;
    expect(upsertArg.employer.length).toBeLessThanOrEqual(100);
    expect(upsertArg.occupation.length).toBeLessThanOrEqual(100);
  });

  it('accepts null started_at', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makePostRequest({ employer: 'ANZ', started_at: null }));
    expect(res.status).toBe(200);
  });
});
