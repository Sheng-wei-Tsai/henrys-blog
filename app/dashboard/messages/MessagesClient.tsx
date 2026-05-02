'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SenderProfile {
  role_title: string;
  city: string;
  visa_type: string;
}

interface Message {
  id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender_profile: SenderProfile | null;
}

interface Props {
  messages: Message[];
  userId: string;
}

const VISA_LABELS: Record<string, string> = {
  '485': '485 Graduate',
  '482':  '482 Sponsored',
  student: 'Student 500',
  pr:      'Permanent Resident',
  citizen: 'Citizen / NZ',
  other:   'Other Visa',
};

function timeAgo(iso: string): string {
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessagesClient({ messages: initial, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [error, setError]       = useState(false);

  async function markRead(id: string) {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, read_at: new Date().toISOString() } : m),
    );
    await fetch(`/api/network/messages/${id}`, { method: 'PATCH' }).catch(() => {
      setError(true);
    });
  }

  const inbox = messages.filter(m => m.recipient_id === userId);
  const sent  = messages.filter(m => m.sender_id   === userId);
  const unreadCount = inbox.filter(m => !m.read_at).length;

  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.1rem',
    fontSize: '0.88rem',
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    border: 'none',
    borderBottom: active ? '2px solid var(--vermilion)' : '2px solid transparent',
    background: 'none',
    color: active ? 'var(--vermilion)' : 'var(--text-muted)',
    fontFamily: 'inherit',
  });

  function MessageRow({ msg }: { msg: Message }) {
    const isIncoming = msg.recipient_id === userId;
    const isUnread   = isIncoming && !msg.read_at;
    return (
      <div
        className={`network-message-row${isUnread ? ' network-message-row--unread' : ''}`}
        onClick={() => { if (isUnread) markRead(msg.id); }}
        role={isUnread ? 'button' : undefined}
        tabIndex={isUnread ? 0 : undefined}
        onKeyDown={e => { if (isUnread && (e.key === 'Enter' || e.key === ' ')) markRead(msg.id); }}
        aria-label={isUnread ? 'Mark as read' : undefined}
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--parchment)',
          background: isUnread ? 'rgba(192,40,28,0.04)' : 'var(--warm-white)',
          cursor: isUnread ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div>
            {isIncoming && msg.sender_profile ? (
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
                {msg.sender_profile.role_title}
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.83rem', marginLeft: '0.4rem' }}>
                  · {msg.sender_profile.city} · {VISA_LABELS[msg.sender_profile.visa_type] ?? msg.sender_profile.visa_type}
                </span>
              </span>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>You</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            {isUnread && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '0.15em 0.55em',
                borderRadius: '10px', background: 'var(--vermilion)', color: 'white',
              }}>
                NEW
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{timeAgo(msg.created_at)}</span>
          </div>
        </div>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {msg.content}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--ink)', marginBottom: '0.25rem' }}>
            Messages
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Messages from your community network connections.
          </p>
        </div>
        <Link
          href="/network"
          style={{
            fontSize: '0.88rem', color: 'var(--vermilion)', fontWeight: 600,
            textDecoration: 'none', border: '1.5px solid var(--vermilion)',
            padding: '0.4rem 0.9rem', borderRadius: '6px',
          }}
        >
          ← Back to Network
        </Link>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(192,40,28,0.07)', border: '1px solid rgba(192,40,28,0.3)', borderRadius: '8px', color: 'var(--vermilion)', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Something went wrong. Please refresh and try again.
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--parchment)', marginBottom: '0' }}>
        <button style={tabStyle(tab === 'inbox')} onClick={() => setTab('inbox')} aria-selected={tab === 'inbox'} role="tab">
          Inbox
          {unreadCount > 0 && (
            <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', fontWeight: 700, padding: '0.1em 0.55em', borderRadius: '10px', background: 'var(--vermilion)', color: 'white' }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button style={tabStyle(tab === 'sent')} onClick={() => setTab('sent')} aria-selected={tab === 'sent'} role="tab">
          Sent
          {sent.length > 0 && (
            <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', opacity: 0.7 }}>({sent.length})</span>
          )}
        </button>
      </div>

      <div style={{ border: 'var(--panel-border)', borderRadius: '0 0 10px 10px', overflow: 'hidden', boxShadow: 'var(--panel-shadow)' }}>
        {tab === 'inbox' && (
          <>
            {inbox.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--warm-white)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No messages yet</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  When someone messages you from the network, it will appear here.
                </div>
              </div>
            ) : (
              inbox.map(m => <MessageRow key={m.id} msg={m} />)
            )}
          </>
        )}

        {tab === 'sent' && (
          <>
            {sent.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--warm-white)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No sent messages</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Messages you send from the network will appear here.
                </div>
              </div>
            ) : (
              sent.map(m => <MessageRow key={m.id} msg={m} />)
            )}
          </>
        )}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', textAlign: 'center' }}>
        You can send up to 5 messages per day. Sender identity is anonymous (role + city only).
      </p>
    </div>
  );
}
