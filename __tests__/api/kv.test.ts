import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We import the module fresh each test by resetting modules when env vars change.
// Default: no KV env vars set.

describe('lib/kv — graceful degradation when KV is not configured', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    vi.resetModules();
  });

  it('kvGet returns null when env vars are absent', async () => {
    const { kvGet } = await import('@/lib/kv');
    expect(await kvGet('any-key')).toBeNull();
  });

  it('kvSet no-ops (does not throw) when env vars are absent', async () => {
    const { kvSet } = await import('@/lib/kv');
    await expect(kvSet('any-key', 'value')).resolves.toBeUndefined();
  });
});

describe('lib/kv — with KV env vars configured', () => {
  const BASE = 'https://kv.example.com';
  const TOKEN = 'test-token';

  beforeEach(() => {
    process.env.KV_REST_API_URL   = BASE;
    process.env.KV_REST_API_TOKEN = TOKEN;
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    vi.unstubAllGlobals();
  });

  it('kvGet returns null on a cache miss', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ result: null }), { status: 200 }),
    );
    const { kvGet } = await import('@/lib/kv');
    expect(await kvGet('missing-key')).toBeNull();
  });

  it('kvGet returns the cached string on a hit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ result: '{"essay":"hello"}' }), { status: 200 }),
    );
    const { kvGet } = await import('@/lib/kv');
    expect(await kvGet('study-guide:abc')).toBe('{"essay":"hello"}');
  });

  it('kvGet sends the correct Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ result: null }), { status: 200 }),
    );
    const { kvGet } = await import('@/lib/kv');
    await kvGet('my-key');
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/get/${encodeURIComponent('my-key')}`,
      expect.objectContaining({ headers: { Authorization: `Bearer ${TOKEN}` } }),
    );
  });

  it('kvGet returns null when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));
    const { kvGet } = await import('@/lib/kv');
    expect(await kvGet('key')).toBeNull();
  });

  it('kvGet returns null on a non-OK HTTP response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 503 }));
    const { kvGet } = await import('@/lib/kv');
    expect(await kvGet('key')).toBeNull();
  });

  it('kvSet calls the pipeline endpoint with SET + EX', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ result: 'OK' }]), { status: 200 }),
    );
    const { kvSet } = await import('@/lib/kv');
    await kvSet('study-guide:xyz', '{"essay":"hi"}', 3600);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/pipeline`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify([['SET', 'study-guide:xyz', '{"essay":"hi"}', 'EX', '3600']]),
      }),
    );
  });

  it('kvSet does not throw when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('timeout'));
    const { kvSet } = await import('@/lib/kv');
    await expect(kvSet('key', 'value')).resolves.toBeUndefined();
  });
});
