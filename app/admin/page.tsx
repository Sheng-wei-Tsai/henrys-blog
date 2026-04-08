'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

interface Stats {
  counts: { users: number; comments: number; applications: number };
  recentComments: Array<{ id: string; content: string; post_slug: string; created_at: string; profiles: { full_name: string } | null }>;
  recentUsers: Array<{ id: string; full_name: string; email: string; role: string; created_at: string }>;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => d.error ? setError(d.error) : setStats(d))
      .catch(() => setError('Failed to load'));
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;

  const card = (label: string, count: number, href: string) => (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
        transition: 'box-shadow 0.15s',
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brown-dark)' }}>{count}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{label}</div>
      </div>
    </Link>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: "'Lora', serif", fontSize: '2rem', color: 'var(--brown-dark)', marginBottom: '0.5rem' }}>
        Admin Panel
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        Overview · <Link href="/admin/users" style={{ color: 'var(--terracotta)' }}>Manage users</Link> · <Link href="/admin/comments" style={{ color: 'var(--terracotta)' }}>Manage comments</Link> · <Link href="/admin/analytics" style={{ color: 'var(--terracotta)' }}>Analytics</Link>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
        {card('Total users',        stats.counts.users,        '/admin/users')}
        {card('Total comments',     stats.counts.comments,     '/admin/comments')}
        {card('Job applications',   stats.counts.applications, '/dashboard')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Recent comments */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '1rem' }}>Recent comments</h2>
          {stats.recentComments.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No comments yet.</p>
            : stats.recentComments.map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid var(--parchment)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--brown-dark)' }}>{c.profiles?.full_name ?? 'Unknown'}</strong> on <em>{c.post_slug}</em> · {fmt(c.created_at)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.content}
                </div>
              </div>
            ))
          }
        </div>

        {/* Recent users */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '1rem' }}>New members</h2>
          {stats.recentUsers.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users yet.</p>
            : stats.recentUsers.map(u => (
              <div key={u.id} style={{ borderBottom: '1px solid var(--parchment)', paddingBottom: '0.75rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{u.full_name || u.email}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmt(u.created_at)}</div>
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '6px',
                  background: u.role === 'admin' ? '#fef9c3' : u.role === 'banned' ? '#fee2e2' : '#f0fdf4',
                  color:      u.role === 'admin' ? '#854d0e' : u.role === 'banned' ? '#991b1b' : '#166534',
                }}>
                  {u.role}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <AdminGuard><Dashboard /></AdminGuard>;
}
