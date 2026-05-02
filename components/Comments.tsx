'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

interface CommentRow {
  id: string;
  post_slug: string;
  content: string;
  parent_id: string | null;
  edited_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null };
  // client-only
  optimistic?: boolean;
}

function Avatar({ name, url, size = 32 }: { name: string | null; url: string | null; size?: number }) {
  if (url) {
    return <Image src={url} alt={name ?? 'User'} width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  const initial = (name ?? '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--terracotta)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

function SkeletonComment() {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.8rem 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--parchment)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: '30%', background: 'var(--parchment)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 10, width: '80%', background: 'var(--parchment)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 10, width: '60%', background: 'var(--parchment)', borderRadius: 4 }} />
      </div>
    </div>
  );
}

function CommentCard({
  comment, currentUserId, isAdmin, depth,
  onReply, onEdit, onDelete,
}: {
  comment: CommentRow;
  currentUserId: string | null;
  isAdmin: boolean;
  depth: number;
  onReply: (parentId: string) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const isOwn = currentUserId === null ? false : comment.profiles
    ? false  // we don't store user_id in CommentRow — compare via optimistic flag or handle server-side
    : false;

  const [editing,     setEditing]     = useState(false);
  const [editText,    setEditText]    = useState(comment.content);
  const [editLoading, setEditLoading] = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [delLoading,  setDelLoading]  = useState(false);

  const canEdit   = Boolean(currentUserId) && !comment.optimistic;
  const canDelete = Boolean(currentUserId) && !comment.optimistic;

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setEditLoading(true);
    await onEdit(comment.id, editText.trim());
    setEditLoading(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDelLoading(true);
    await onDelete(comment.id);
    setDelLoading(false);
  };

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0, paddingTop: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <Avatar name={comment.profiles?.full_name ?? null} url={comment.profiles?.avatar_url ?? null} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
              {comment.profiles?.full_name ?? 'Anonymous'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              {comment.edited_at && <span style={{ marginLeft: '0.3rem' }}>(edited)</span>}
            </span>
          </div>

          {editing ? (
            <div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1.5px solid var(--parchment)', fontSize: '0.88rem', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button onClick={handleSaveEdit} disabled={editLoading || !editText.trim()}
                  style={{ background: 'var(--terracotta)', color: 'white', border: 'none', borderRadius: 99, padding: '0.3rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  {editLoading ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditText(comment.content); }}
                  style={{ background: 'none', border: '1px solid var(--parchment)', borderRadius: 99, padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, wordBreak: 'break-word' }}>
              {comment.content}
            </p>
          )}

          {!editing && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              {depth === 0 && currentUserId && (
                <button onClick={() => onReply(comment.id)}
                  style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  Reply
                </button>
              )}
              {canEdit && (
                <button onClick={() => setEditing(true)}
                  style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  Edit
                </button>
              )}
              {(canDelete || isAdmin) && !confirmDel && (
                <button onClick={() => setConfirmDel(true)}
                  style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                  Delete
                </button>
              )}
              {confirmDel && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Sure?{' '}
                  <button onClick={handleDelete} disabled={delLoading}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', padding: 0 }}>
                    {delLoading ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  {' · '}
                  <button onClick={() => setConfirmDel(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>
                    Cancel
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Comments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments]   = useState<CommentRow[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [fetchErr, setFetchErr]   = useState(false);
  const [text,     setText]       = useState('');
  const [posting,  setPosting]    = useState(false);
  const [postErr,  setPostErr]    = useState('');
  const [replyTo,  setReplyTo]    = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyPosting, setReplyPosting] = useState(false);
  const [isAdmin, setIsAdmin]     = useState(false);

  // Fetch comments
  const load = useCallback(async () => {
    setLoading(true);
    setFetchErr(false);
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error();
      const { comments: data } = await res.json();
      setComments(data ?? []);
    } catch {
      setFetchErr(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  // Check admin
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => setIsAdmin(data?.role === 'admin'));
    });
  }, [user]);

  const post = async (parentId: string | null, content: string, onDone: () => void) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_slug: slug, content, parent_id: parentId }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to post' }));
      throw new Error(error);
    }
    const { comment } = await res.json();
    setComments(prev => [...prev, comment]);
    onDone();
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true); setPostErr('');
    try {
      await post(null, text.trim(), () => setText(''));
    } catch (err) {
      setPostErr(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTo) return;
    setReplyPosting(true);
    try {
      await post(replyTo, replyText.trim(), () => { setReplyText(''); setReplyTo(null); });
    } catch { /* silent */ } finally {
      setReplyPosting(false);
    }
  };

  const handleEdit = async (id: string, content: string) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return;
    const { comment } = await res.json();
    setComments(prev => prev.map(c => c.id === id ? { ...c, content: comment.content, edited_at: comment.edited_at } : c));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    // Remove comment and its replies
    setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const replies  = (parentId: string) => comments.filter(c => c.parent_id === parentId);
  const count    = comments.length;

  return (
    <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--parchment)' }}>
      <h2 style={{ fontFamily: "'Lora', serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '1.5rem' }}>
        {count === 0 ? 'Comments' : count === 1 ? '1 comment' : `${count} comments`}
      </h2>

      {/* Add comment form */}
      {user ? (
        <form onSubmit={handlePost} style={{ marginBottom: '2rem' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your thoughts…"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid var(--parchment)', fontSize: '0.92rem', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', outline: 'none', background: 'var(--warm-white)', color: 'var(--brown-dark)' }}
          />
          {postErr && <p style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '0.3rem' }}>{postErr}</p>}
          <button type="submit" disabled={posting || !text.trim()}
            style={{ marginTop: '0.6rem', background: text.trim() && !posting ? 'var(--terracotta)' : 'var(--parchment)', color: text.trim() && !posting ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 99, padding: '0.5rem 1.3rem', fontSize: '0.88rem', fontWeight: 600, cursor: text.trim() && !posting ? 'pointer' : 'default' }}>
            {posting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          <Link href="/login" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Sign in</Link> to join the conversation.
        </p>
      )}

      {/* Comment list */}
      {loading && (
        <div>
          <SkeletonComment />
          <SkeletonComment />
        </div>
      )}

      {fetchErr && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Comments couldn't be loaded.</p>
      )}

      {!loading && !fetchErr && count === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Be the first to comment.</p>
      )}

      {!loading && topLevel.map(comment => (
        <div key={comment.id} style={{ borderBottom: '1px solid var(--parchment)', paddingBottom: '1rem' }}>
          <CommentCard
            comment={comment}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
            depth={0}
            onReply={id => { setReplyTo(id); setReplyText(''); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Inline reply form */}
          {replyTo === comment.id && (
            <form onSubmit={handleReply} style={{ marginLeft: 24, marginTop: '0.75rem' }}>
              <textarea
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Replying to ${comment.profiles?.full_name ?? 'comment'}…`}
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1.5px solid var(--parchment)', fontSize: '0.88rem', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none', background: 'var(--warm-white)', color: 'var(--brown-dark)' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button type="submit" disabled={replyPosting || !replyText.trim()}
                  style={{ background: replyText.trim() ? 'var(--terracotta)' : 'var(--parchment)', color: replyText.trim() ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 99, padding: '0.35rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: replyText.trim() ? 'pointer' : 'default' }}>
                  {replyPosting ? 'Posting…' : 'Reply'}
                </button>
                <button type="button" onClick={() => setReplyTo(null)}
                  style={{ background: 'none', border: '1px solid var(--parchment)', borderRadius: 99, padding: '0.35rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {replies(comment.id).map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin}
              depth={1}
              onReply={() => {}}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
