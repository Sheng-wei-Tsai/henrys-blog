'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Conversation {
  partnerId: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
  partner: { id: string; role_title: string; city: string } | null;
}

interface ThreadMessage {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  myProfileId: string;
  initialPartnerId: string | null;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ConversationRow({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const label = conv.partner?.role_title ?? 'Network member';
  const city  = conv.partner?.city ?? '';

  return (
    <button
      className={`dm-conv-row${active ? ' dm-conv-row-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="dm-conv-avatar" aria-hidden="true">
        {label.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {label}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {timeAgo(conv.lastAt)}
          </span>
        </div>
        {city && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {city}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {conv.lastMessage}
          </span>
          {conv.unreadCount > 0 && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--vermilion)', color: 'white', borderRadius: '10px', padding: '0.1em 0.5em', flexShrink: 0 }}>
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMine }: { msg: ThreadMessage; isMine: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '0.6rem' }}>
      <div
        style={{
          maxWidth: '76%',
          padding: '0.6rem 0.9rem',
          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isMine ? 'var(--vermilion)' : 'var(--cream)',
          color: isMine ? 'white' : 'var(--text-primary)',
          border: isMine ? 'none' : '1.5px solid var(--parchment)',
          fontSize: '0.9rem',
          lineHeight: 1.45,
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
        <div style={{ fontSize: '0.68rem', marginTop: '0.3rem', opacity: 0.7, textAlign: 'right' }}>
          {timeAgo(msg.created_at)}
        </div>
      </div>
    </div>
  );
}

export default function MessagesClient({ myProfileId, initialPartnerId }: Props) {
  const [conversations, setConversations]     = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId);
  const [thread, setThread]                   = useState<ThreadMessage[]>([]);
  const [compose, setCompose]                 = useState('');
  const [sending, setSending]                 = useState(false);
  const [sendError, setSendError]             = useState('');
  const [convsLoading, setConvsLoading]       = useState(true);
  const [threadLoading, setThreadLoading]     = useState(false);
  const [convsError, setConvsError]           = useState(false);
  const [threadError, setThreadError]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.partnerId === activePartnerId) ?? null;

  // Fetch conversation list on mount
  useEffect(() => {
    setConvsLoading(true);
    fetch('/api/network/messages')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Conversation[]) => { setConversations(data); setConvsError(false); })
      .catch(() => setConvsError(true))
      .finally(() => setConvsLoading(false));
  }, []);

  // Fetch thread when active partner changes
  const loadThread = useCallback((partnerId: string) => {
    setThreadLoading(true);
    setThreadError(false);
    fetch(`/api/network/messages/${partnerId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ThreadMessage[]) => {
        setThread(data);
        fetch(`/api/network/messages/${partnerId}`, { method: 'PATCH' }).catch(() => {});
        setConversations(prev =>
          prev.map(c => c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c),
        );
      })
      .catch(() => setThreadError(true))
      .finally(() => setThreadLoading(false));
  }, []);

  useEffect(() => {
    if (activePartnerId) loadThread(activePartnerId);
    else setThread([]);
  }, [activePartnerId, loadThread]);

  // Auto-scroll to bottom when thread updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  function selectConv(partnerId: string) {
    setActivePartnerId(partnerId);
    setSendError('');
    setCompose('');
  }

  async function handleSend() {
    if (!activePartnerId || !compose.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/network/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_profile_id: activePartnerId, content: compose.trim() }),
      });
      const data = await res.json() as { error?: string; id?: string };
      if (!res.ok) {
        setSendError(data.error ?? 'Failed to send');
        return;
      }
      setThread(prev => [
        ...prev,
        {
          id: data.id ?? crypto.randomUUID(),
          sender_profile_id: myProfileId,
          recipient_profile_id: activePartnerId,
          content: compose.trim(),
          created_at: new Date().toISOString(),
          read_at: null,
        },
      ]);
      setConversations(prev =>
        prev.map(c =>
          c.partnerId === activePartnerId
            ? { ...c, lastMessage: compose.trim(), lastAt: new Date().toISOString() }
            : c,
        ),
      );
      setCompose('');
    } catch {
      setSendError('Network error — please try again');
    } finally {
      setSending(false);
    }
  }

  const showThread = !!activePartnerId;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', color: 'var(--ink)', marginBottom: '0.25rem' }}>
            Messages
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Anonymous — real names and emails are never shared.
          </p>
        </div>
        <Link
          href="/network"
          style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--vermilion)', fontWeight: 600, textDecoration: 'underline' }}
        >
          ← Network
        </Link>
      </div>

      {/* Two-panel layout */}
      <div className={`dm-layout${showThread ? ' dm-thread-open' : ''}`}>

        {/* Left: conversation list */}
        <div className="dm-sidebar">
          <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid var(--parchment)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Conversations
          </div>

          {convsLoading && (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Loading…
            </div>
          )}

          {convsError && (
            <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Could not load conversations.
            </div>
          )}

          {!convsLoading && !convsError && conversations.length === 0 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>💬</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.35rem' }}>
                No messages yet
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Browse the{' '}
                <Link href="/network" style={{ color: 'var(--vermilion)', fontWeight: 700 }}>
                  network
                </Link>
                {' '}and message a referrer.
              </div>
            </div>
          )}

          {conversations.map(conv => (
            <ConversationRow
              key={conv.partnerId}
              conv={conv}
              active={conv.partnerId === activePartnerId}
              onClick={() => selectConv(conv.partnerId)}
            />
          ))}
        </div>

        {/* Right: thread or empty state */}
        <div className="dm-thread-panel">
          {!activePartnerId ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.5rem', padding: '2rem' }}>
              <div style={{ fontSize: '2rem' }}>👈</div>
              <div style={{ fontSize: '0.9rem' }}>Select a conversation to read it</div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--parchment)', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <button
                  className="dm-back-btn"
                  onClick={() => setActivePartnerId(null)}
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {activeConv?.partner?.role_title ?? 'Network member'}
                  </div>
                  {activeConv?.partner?.city && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeConv.partner.city}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="dm-messages-scroll">
                {threadLoading && (
                  <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Loading…
                  </div>
                )}
                {threadError && (
                  <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Could not load thread.
                  </div>
                )}
                {!threadLoading && !threadError && thread.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.sender_profile_id === myProfileId}
                  />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              <div className="dm-compose-area">
                {sendError && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--vermilion)', marginBottom: '0.4rem' }}>
                    {sendError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
                  <textarea
                    className="dm-compose-input"
                    value={compose}
                    onChange={e => setCompose(e.target.value)}
                    placeholder="Write a message… (500 chars max)"
                    maxLength={500}
                    rows={2}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    aria-label="Compose message"
                  />
                  <button
                    className="dm-send-btn"
                    onClick={handleSend}
                    disabled={sending || !compose.trim()}
                    aria-label="Send message"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'right' }}>
                  {compose.length}/500 · Enter to send · Shift+Enter for new line
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
