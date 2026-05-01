import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/auth-server', () => ({
  createSupabaseService: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({ insert: mockInsert }),
  }),
}));

const { POST } = await import('@/app/api/log-error/route');

function makePost(body: object, ip = '1.2.3.4') {
  return new NextRequest('http://localhost/api/log-error', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  });
}

describe('POST /api/log-error', () => {
  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/log-error', {
      method: 'POST',
      body: '{not json}',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.1' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with ok:true on a valid request', async () => {
    const res = await POST(makePost({ message: 'TypeError: x is undefined', url: '/page' }, '2.2.2.1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 429 on the 11th POST from the same IP within 60 s', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 10; i++) {
      const res = await POST(makePost({ message: `err ${i}` }, ip));
      expect(res.status).toBe(200);
    }
    const res = await POST(makePost({ message: 'over limit' }, ip));
    expect(res.status).toBe(429);
  });

  it('returns 200 even when the Supabase insert throws', async () => {
    mockInsert.mockRejectedValueOnce(new Error('relation "error_logs" does not exist'));
    const res = await POST(makePost({ message: 'db fail', url: '/crash' }, '3.3.3.1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('truncates message to 500 chars before inserting', async () => {
    const longMessage = 'E'.repeat(600);
    await POST(makePost({ message: longMessage, url: '/test' }, '4.4.4.1'));
    const inserted = mockInsert.mock.calls.at(-1)?.[0] as { message: string };
    expect(inserted.message.length).toBe(500);
  });
});
