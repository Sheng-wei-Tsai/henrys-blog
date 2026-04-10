'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogList from '@/components/BlogList';
import { Post } from '@/lib/posts';

type Tab = 'all' | 'blog' | 'research' | 'githot' | 'ai-news' | 'visa-news';

const TABS: { id: Tab; label: string; emoji: string; desc: string }[] = [
  { id: 'all',       label: 'All',      emoji: '📚', desc: 'Everything' },
  { id: 'blog',      label: 'Blog',     emoji: '✍️',  desc: 'Posts & articles' },
  { id: 'research',  label: 'Research', emoji: '🤖', desc: 'AI research digest' },
  { id: 'githot',    label: 'Githot',   emoji: '🔥', desc: 'GitHub trending' },
  { id: 'ai-news',   label: 'AI News',  emoji: '📡', desc: 'Daily from Anthropic, OpenAI & Google' },
  { id: 'visa-news', label: 'Visa News', emoji: '📰', desc: 'Daily AU immigration & student visa updates' },
];

interface Props {
  posts:    Post[];
  digests:  Post[];
  githot:   Post[];
  ainews:   Post[];
  visanews: Post[];
  tags:     string[];
}

function BlogHubInner({ posts, digests, githot, ainews, visanews, tags }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const raw    = params.get('category') as Tab | null;
  const tab: Tab = raw && TABS.some(t => t.id === raw) ? raw : 'all';

  const setTab = (t: Tab) => {
    const p = new URLSearchParams(params.toString());
    if (t === 'all') p.delete('category'); else p.set('category', t);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  // Merge + sort all for the "All" tab — newest first
  const allPosts = [...posts, ...digests, ...githot, ...ainews, ...visanews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activePosts =
    tab === 'all'       ? allPosts :
    tab === 'blog'      ? posts    :
    tab === 'research'  ? digests  :
    tab === 'githot'    ? githot   :
    tab === 'ai-news'   ? ainews   :
                          visanews;

  // For "all" tab, no tag filtering (tags belong to blog only)
  const activeTags = (tab === 'blog' || tab === 'all') ? tags : [];

  return (
    <>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
        {TABS.map(t => {
          const count =
            t.id === 'all'       ? allPosts.length  :
            t.id === 'blog'      ? posts.length     :
            t.id === 'research'  ? digests.length   :
            t.id === 'githot'    ? githot.length    :
            t.id === 'ai-news'   ? ainews.length    :
                                   visanews.length;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.1rem', borderRadius: '99px', flexShrink: 0,
              background: active ? 'var(--terracotta)' : 'var(--warm-white)',
              color: active ? 'white' : 'var(--text-secondary)',
              border: active ? 'none' : '1px solid var(--parchment)',
              fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s ease',
              boxShadow: active ? '2px 2px 0 rgba(20,10,5,0.25)' : 'none',
            }}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '0.05em 0.45em',
                borderRadius: '99px',
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--parchment)',
                color: active ? 'white' : 'var(--text-muted)',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      {tab !== 'all' && (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem', borderLeft: '3px solid var(--terracotta)', paddingLeft: '0.85rem', lineHeight: 1.6 }}>
          {TABS.find(t => t.id === tab)?.desc}
        </p>
      )}

      <BlogList posts={activePosts} tags={activeTags} />
    </>
  );
}

export default function BlogHub(props: Props) {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Loading&hellip;</div>}>
      <BlogHubInner {...props} />
    </Suspense>
  );
}
