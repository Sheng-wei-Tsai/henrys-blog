import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Hoist mock fns so vi.mock factories can reference them
const { mockGetUser, mockUpsert, mockSingle } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockUpsert  = vi.fn();
  const mockSingle  = vi.fn();
  return { mockGetUser, mockUpsert, mockSingle };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [] }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
    from:  () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      upsert: mockUpsert,
    }),
  }),
}));

const { GET, POST } = await import('@/app/api/visa-tracker/route');

function makePost(body: object) {
  return new NextRequest('http://localhost/api/visa-tracker', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('GET /api/visa-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockSingle.mockResolvedValue({ data: null });
  });

  it('returns 401 without auth', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when authenticated but no record exists', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValueOnce({ data: null });

    const res  = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.employer).toBe('');
  });

  it('returns stored tracker data for authenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValueOnce({ data: { employer: 'Acme', occupation: 'Engineer', started_at: '2024-01-01', steps: {} } });

    const res  = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.employer).toBe('Acme');
  });
});

describe('POST /api/visa-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('returns 401 without auth', async () => {
    const res = await POST(makePost({ employer: 'Acme' }));
    expect(res.status).toBe(401);
  });

  it('accepts normal-length employer and occupation', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    const res = await POST(makePost({ employer: 'Acme', occupation: 'Engineer' }));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ employer: 'Acme', occupation: 'Engineer' }),
      expect.any(Object),
    );
  });

  it('truncates employer to 100 chars when oversized', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    const res = await POST(makePost({ employer: 'A'.repeat(150) }));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ employer: 'A'.repeat(100) }),
      expect.any(Object),
    );
  });

  it('truncates occupation to 100 chars when oversized', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    const res = await POST(makePost({ occupation: 'B'.repeat(200) }));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ occupation: 'B'.repeat(100) }),
      expect.any(Object),
    );
  });

  it('returns 400 for invalid started_at format', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    const res  = await POST(makePost({ started_at: 'not-a-date' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/started_at/i);
  });

  it('accepts a valid ISO date for started_at', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    const res = await POST(makePost({ started_at: '2024-03-15' }));
    expect(res.status).toBe(200);
  });

  it('accepts null started_at', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    const res = await POST(makePost({ started_at: null }));
    expect(res.status).toBe(200);
  });
});
