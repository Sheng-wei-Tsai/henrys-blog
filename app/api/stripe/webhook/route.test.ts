/**
 * Stripe webhook route tests.
 *
 * Covers: signature validation, subscription lifecycle events.
 * Does NOT test Stripe API calls (those are Stripe's responsibility).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoist mock fns so vi.mock factories can reference them ────────────────────
const { mockConstructEvent, mockRetrieve, mockUpdate, mockEq } = vi.hoisted(() => {
  const mockEq             = vi.fn();
  const mockUpdate         = vi.fn(() => ({ eq: mockEq }));
  const mockConstructEvent = vi.fn();
  const mockRetrieve       = vi.fn();
  return { mockConstructEvent, mockRetrieve, mockUpdate, mockEq };
});

vi.mock('stripe', () => ({
  default: class {
    webhooks      = { constructEvent: mockConstructEvent };
    subscriptions = { retrieve: mockRetrieve };
  },
}));

vi.mock('@/lib/auth-server', () => ({
  createSupabaseService: () => ({
    from: vi.fn(() => ({ update: mockUpdate })),
  }),
}));

// Import route AFTER mocks are set up
const { POST } = await import('./route');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: string, signature = 'valid-sig') {
  return new NextRequest('https://example.com/api/stripe/webhook', {
    method:  'POST',
    body,
    headers: { 'stripe-signature': signature },
  });
}

function makeEvent(type: string, data: object) {
  return { type, data: { object: data } };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  // ── Signature validation ────────────────────────────────────────────────────

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Webhook signature verification failed');
    });

    const res = await POST(makeRequest('bad-body', 'bad-sig'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid webhook signature');
  });

  it('returns 200 for unknown event types without error', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('some.unknown.event', {}));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  // ── checkout.session.completed ──────────────────────────────────────────────

  it('upgrades user to pro on checkout.session.completed', async () => {
    const userId = 'user-123';
    mockRetrieve.mockResolvedValue({
      metadata: { supabase_user_id: userId },
      items:    { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 2592000 }] },
    });
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', {
      metadata:     { supabase_user_id: userId },
      subscription: 'sub_abc',
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ subscription_tier: 'pro' }));
  });

  it('skips upgrade when userId is missing from checkout metadata', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', {
      metadata:     {},
      subscription: 'sub_abc',
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── customer.subscription.deleted ──────────────────────────────────────────

  it('downgrades user to free on customer.subscription.deleted', async () => {
    const userId = 'user-456';
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.deleted', {
      metadata: { supabase_user_id: userId },
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_tier:       'free',
      subscription_expires_at: null,
    }));
  });

  it('skips downgrade when userId is missing from subscription metadata', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.deleted', {
      metadata: {},
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ──────────────────────────────────────────

  it('re-activates pro when subscription.updated status is active', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', {
      metadata: { supabase_user_id: 'user-789' },
      status:   'active',
      items:    { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 2592000 }] },
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ subscription_tier: 'pro' }));
  });

  it('downgrades to free when subscription.updated status is canceled', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', {
      metadata: { supabase_user_id: 'user-789' },
      status:   'canceled',
      items:    { data: [] },
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      subscription_tier:       'free',
      subscription_expires_at: null,
    }));
  });

  it('re-activates pro when subscription.updated status is trialing', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', {
      metadata: { supabase_user_id: 'user-tri' },
      status:   'trialing',
      items:    { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 604800 }] },
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ subscription_tier: 'pro' }));
  });

  // ── invoice.payment_failed ──────────────────────────────────────────────────

  it('preserves period-end expiry on invoice.payment_failed', async () => {
    const userId = 'user-101';
    const futureTs = Math.floor(Date.now() / 1000) + 86400;
    mockRetrieve.mockResolvedValue({
      metadata: { supabase_user_id: userId },
      items:    { data: [{ current_period_end: futureTs }] },
    });
    mockConstructEvent.mockReturnValue(makeEvent('invoice.payment_failed', {
      subscription: 'sub_xyz',
    }));

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_expires_at: expect.any(String) }),
    );
  });
});
