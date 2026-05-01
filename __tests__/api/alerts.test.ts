import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

const mockGetUser  = vi.fn().mockResolvedValue({ data: { user: null } });
const mockDeleteFn = vi.fn();

// Build a thenable chain matching: .delete({ count: 'exact' }).eq(id).eq(user_id)
function makeDeleteChain(result: { error: { message: string } | null; count: number }) {
  const leaf = {
    then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return { eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(leaf) }) };
}

vi.mock('@/lib/auth-server', () => ({
  createSupabaseServer: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ id: VALID_UUID }], error: null }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: VALID_UUID, keywords: 'engineer', location: 'Sydney', frequency: 'weekly' },
            error: null,
          }),
        }),
      }),
      delete: mockDeleteFn,
    })),
  }),
}));

const { GET, POST, DELETE } = await import('@/app/api/alerts/route');

function makeReq(method: string, url: string, body?: object) {
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : {}),
  });
}

// ── GET ────────────────────────────────────────────────────────────────────────
describe('GET /api/alerts', () => {
  beforeEach(() => mockGetUser.mockReset());

  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 200 with alerts array for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res  = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.alerts)).toBe(true);
  });
});

// ── POST ───────────────────────────────────────────────────────────────────────
describe('POST /api/alerts', () => {
  beforeEach(() => mockGetUser.mockReset());

  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeReq('POST', 'http://localhost/api/alerts', { keywords: 'dev' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when keywords is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res = await POST(makeReq('POST', 'http://localhost/api/alerts', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/keywords/i);
  });

  it('returns 201 with alert on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res  = await POST(makeReq('POST', 'http://localhost/api/alerts', { keywords: 'software engineer', location: 'Melbourne' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alert).toBeDefined();
  });
});

// ── DELETE ─────────────────────────────────────────────────────────────────────
describe('DELETE /api/alerts', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockDeleteFn.mockReset();
    mockDeleteFn.mockReturnValue(makeDeleteChain({ error: null, count: 1 }));
  });

  it('returns 401 without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(makeReq('DELETE', `http://localhost/api/alerts?id=${VALID_UUID}`));
    expect(res.status).toBe(401);
  });

  it('returns 400 when id param is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res = await DELETE(makeReq('DELETE', 'http://localhost/api/alerts'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid id format', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res = await DELETE(makeReq('DELETE', 'http://localhost/api/alerts?id=not-a-real-uuid'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid id/i);
  });

  it('returns 404 when 0 rows are affected — ownership check prevents deleting another user\'s alert', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockDeleteFn.mockReturnValueOnce(makeDeleteChain({ error: null, count: 0 }));
    const res  = await DELETE(makeReq('DELETE', `http://localhost/api/alerts?id=${VALID_UUID}`));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 200 when own alert is deleted (1 row affected)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const res  = await DELETE(makeReq('DELETE', `http://localhost/api/alerts?id=${VALID_UUID}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 when Supabase returns an error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockDeleteFn.mockReturnValueOnce(makeDeleteChain({ error: { message: 'db error' }, count: 0 }));
    const res  = await DELETE(makeReq('DELETE', `http://localhost/api/alerts?id=${VALID_UUID}`));
    expect(res.status).toBe(500);
  });
});
