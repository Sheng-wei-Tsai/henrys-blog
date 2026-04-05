'use client';

import { useState, useEffect } from 'react';

const TAMA_KEY = 'tama_pet';
const FED_KEY  = 'tama_fed';

function foodIcon(tags: string[]): { icon: string; label: string } {
  const t = tags.join(' ').toLowerCase();
  if (t.includes('ai') || t.includes('ml') || t.includes('llm'))
    return { icon: '🔮', label: 'circuit chip' };
  if (t.includes('code') || t.includes('typescript') || t.includes('react') || t.includes('dev'))
    return { icon: '🐛', label: 'pixel bug' };
  if (t.includes('travel') || t.includes('brisbane') || t.includes('australia'))
    return { icon: '🥭', label: 'mango slice' };
  if (t.includes('life') || t.includes('career') || t.includes('job'))
    return { icon: '🌿', label: 'leafy green' };
  return { icon: '🦗', label: 'cricket' };
}

function parseMinutes(readingTime: string): number {
  const match = readingTime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 3;
}

function isAlreadyFed(slug: string): boolean {
  try {
    const raw = localStorage.getItem(FED_KEY);
    return raw ? JSON.parse(raw).includes(slug) : false;
  } catch { return false; }
}

function markFed(slug: string) {
  try {
    const raw = localStorage.getItem(FED_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(slug)) {
      arr.push(slug);
      localStorage.setItem(FED_KEY, JSON.stringify(arr));
    }
  } catch {}
}

/** Write XP + hunger directly into tama_pet and fire a storage event for live sync */
function feedTama(slug: string, nutrition: number) {
  try {
    const raw = localStorage.getItem(TAMA_KEY);
    if (!raw) return;
    const pet = JSON.parse(raw);

    const isNew = !isAlreadyFed(slug);
    const xpGain     = isNew ? nutrition : Math.floor(nutrition / 2);
    const hungerGain = isNew ? Math.min(2, nutrition) : 1;

    pet.hunger    = Math.min(4, (pet.hunger    ?? 4) + hungerGain);
    pet.happiness = Math.min(4, (pet.happiness ?? 4) + (isNew ? 0.5 : 0));
    pet.xp        = (pet.xp ?? 0) + xpGain;
    if (isNew) pet.postsRead = (pet.postsRead ?? 0) + 1;

    markFed(slug);
    localStorage.setItem(TAMA_KEY, JSON.stringify(pet));
    // Fire storage event so TamaSection on /about picks it up live if open
    window.dispatchEvent(new StorageEvent('storage', { key: TAMA_KEY, newValue: JSON.stringify(pet) }));
  } catch {}
}

interface Props {
  slug:        string;
  readingTime: string;
  tags:        string[];
}

export default function FeedButton({ slug, readingTime, tags }: Props) {
  const [fed, setFed]           = useState(false);
  const [animating, setAnimating] = useState(false);
  const [petName, setPetName]   = useState('Buddy');

  useEffect(() => {
    setFed(isAlreadyFed(slug));
    try {
      const raw = localStorage.getItem(TAMA_KEY);
      if (raw) {
        const pet = JSON.parse(raw);
        if (pet.name) setPetName(pet.name);
      }
    } catch {}
  }, [slug]);

  const minutes   = parseMinutes(readingTime);
  const nutrition = Math.max(1, Math.ceil(minutes));
  const food      = foodIcon(tags);

  function handleFeed() {
    if (fed || animating) return;
    setAnimating(true);
    feedTama(slug, nutrition);
    setTimeout(() => {
      setFed(true);
      setAnimating(false);
    }, 1200);
  }

  return (
    <div style={{
      background:   'var(--warm-white)',
      border:       '2px solid var(--ink)',
      borderRadius: '8px',
      boxShadow:    '3px 3px 0 var(--ink)',
      padding:      '1.25rem 1.5rem',
      display:      'flex',
      alignItems:   'center',
      gap:          '1rem',
      flexWrap:     'wrap',
    }}>
      <div style={{ fontSize: '2.2rem', lineHeight: 1, filter: fed ? 'grayscale(0.3)' : 'none', transition: 'filter 0.3s' }}>
        🤖
      </div>

      <div style={{ flex: 1, minWidth: '180px' }}>
        <p style={{ margin: '0 0 0.2rem', fontFamily: "'Lora', serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--brown-dark)' }}>
          {fed ? `${petName} enjoyed this post!` : `Feed this to ${petName}?`}
        </p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {fed
            ? `+${nutrition} XP · ${food.icon} ${food.label} delivered · head to /about to see your pet`
            : `Worth ${nutrition} XP · ${food.icon} ${food.label} · feeds & evolves your TamaAussie`}
        </p>
      </div>

      <button
        onClick={handleFeed}
        disabled={fed || animating}
        style={{
          background:   fed ? 'var(--parchment)' : animating ? 'var(--jade)' : 'var(--vermilion)',
          color:        fed ? 'var(--text-muted)' : 'white',
          border:       '2px solid var(--ink)',
          borderRadius: '4px',
          boxShadow:    fed ? 'none' : '2px 2px 0 var(--ink)',
          padding:      '0.5em 1.1em',
          fontSize:     '0.85rem',
          fontWeight:   700,
          cursor:       fed ? 'default' : 'pointer',
          fontFamily:   "'Space Grotesk', sans-serif",
          transition:   'all 0.2s',
          transform:    animating ? 'scale(0.96)' : 'scale(1)',
          whiteSpace:   'nowrap',
          flexShrink:   0,
        }}
      >
        {animating ? `${food.icon} Feeding…` : fed ? '✓ Fed' : `${food.icon} Feed ${petName}`}
      </button>

      {animating && (
        <div style={{
          position:   'fixed',
          pointerEvents: 'none',
          zIndex:     9999,
          fontSize:   '1.8rem',
          animation:  'feedFly 1.2s ease-in forwards',
          top: '50%', left: '50%',
        }}>
          {food.icon}
          <style>{`@keyframes feedFly{0%{transform:translate(-50%,-50%) scale(1);opacity:1}60%{transform:translate(-50%,-120px) scale(1.4);opacity:1}100%{transform:translate(-50%,-200px) scale(0.4);opacity:0}}`}</style>
        </div>
      )}
    </div>
  );
}
