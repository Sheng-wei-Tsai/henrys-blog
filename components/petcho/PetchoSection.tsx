'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnimationState } from './types';
import { usePetcho } from './usePetcho';
import HabitatScene from './HabitatScene';
import HungerBar from './HungerBar';
import PetCreator from './PetCreator';
import UnlockToast from './UnlockToast';
import { getCreature, HABITAT_THEME } from './evolution';
import { AudioEngine } from './AudioEngine';

const HopperSprite = dynamic(() => import('./HopperSprite'), { ssr: false });
const PetShareCard = dynamic(() => import('./PetShareCard'), { ssr: false });

// ─── Hint messages ────────────────────────────────────────────────────────────
const HINT: Record<AnimationState, string> = {
  idle:   'tap the screen to interact',
  pet:    'feeling the connection ♥',
  happy:  'OVERLOAD!! ecstatic!!',
  eat:    'processing nutrition...',
  hungry: '⚠ HUNGRY — read a post to feed!',
  sleep:  'sleep_mode: active  💤',
};

type UnlockCheck = (totalPets: number, level: number) => string | null;
const UNLOCK_CHECKS: UnlockCheck[] = [
  (p)    => p === 10  ? '10 interactions! Buddy is warming up' : null,
  (p)    => p === 50  ? '50 pets! Deep bond forming 🤖'        : null,
  (p)    => p === 100 ? '100 interactions! True companion 🏆'  : null,
  (_, l) => l === 2   ? null : null, // handled by evolution toast below
  (_, l) => l === 3   ? null : null,
  (_, l) => l === 4   ? null : null,
  (_, l) => l === 5   ? null : null,
];

function getSleepState(): boolean {
  const h = new Date().getHours();
  return h >= 23 || h < 6;
}

// ─── Tamagotchi button ────────────────────────────────────────────────────────
function TamaBtn({
  keyLabel, label, onClick, urgent, disabled,
}: {
  keyLabel: string;
  label:    string;
  onClick:  () => void;
  urgent?:  boolean;
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const down = () => { if (!disabled) setPressed(true); };
  const up   = () => { setPressed(false); if (!disabled) onClick(); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <button
        onMouseDown={down} onMouseUp={up}
        onTouchStart={down} onTouchEnd={up}
        disabled={disabled}
        style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: disabled
            ? 'linear-gradient(145deg, #5A2010, #3A1008)'
            : pressed
              ? 'linear-gradient(145deg, #7A2210, #B03A18)'
              : urgent
                ? 'linear-gradient(145deg, #C04820, #8A2010)'
                : 'linear-gradient(145deg, #D44E2C, #9A2A10)',
          border:     `2.5px solid ${urgent ? '#8A1010' : '#7A2210'}`,
          boxShadow:  pressed || disabled ? '0 1px 0 #4A1005' : `0 5px 0 #5A1808, inset 0 1px 0 rgba(255,200,150,0.22)`,
          cursor:     disabled ? 'not-allowed' : 'pointer',
          outline:    'none',
          transform:  pressed ? 'translateY(4px)' : 'none',
          transition: 'transform 0.05s, box-shadow 0.05s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color:      disabled ? 'rgba(255,180,120,0.25)' : 'rgba(255,210,170,0.75)',
          fontSize:   '0.6rem', fontFamily: '"Courier New", monospace',
          fontWeight: 700, letterSpacing: '0.04em',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {keyLabel}
      </button>
      <span style={{
        fontSize: '0.52rem', fontFamily: '"Courier New", monospace',
        color: urgent ? '#FF6666' : disabled ? 'rgba(255,150,80,0.25)' : 'rgba(255,190,130,0.45)',
        letterSpacing: '0.1em', fontWeight: 700,
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Creature info card ────────────────────────────────────────────────────────
function CreatureCard({ speciesId }: { speciesId: string }) {
  const def = getCreature(speciesId);
  if (!def) return null;
  const theme = HABITAT_THEME[def.habitat];
  return (
    <div style={{
      background:   '#050A05',
      border:       `1.5px solid ${theme.mid}`,
      borderRadius: '6px',
      padding:      '8px 10px',
      fontFamily:   '"Courier New", Courier, monospace',
      fontSize:     '0.6rem',
      lineHeight:   1.6,
    }}>
      <div style={{ marginBottom: '3px' }}>
        <span style={{ color: theme.primary, fontWeight: 700, fontSize: '0.68rem' }}>
          {def.name}
        </span>
        {' '}
        <span style={{ color: theme.dim, fontStyle: 'italic' }}>{def.sciName}</span>
        <span style={{
          marginLeft: '6px',
          color: def.rarity === 'Legendary' ? '#FFB000' : def.rarity === 'Very Rare' ? '#FF6633' : theme.mid,
          fontWeight: 700, fontSize: '0.55rem',
        }}>
          [{def.rarity.toUpperCase()}]
        </span>
      </div>
      <div style={{ color: theme.dim, marginBottom: '2px' }}>
        {'>'} region: <span style={{ color: theme.mid }}>{def.region}</span>
      </div>
      <div style={{ color: theme.dim, marginBottom: '3px' }}>
        {'>'} {def.funFact}
      </div>
      <div style={{ color: theme.primary, fontSize: '0.55rem', opacity: 0.7 }}>
        ★ {def.unlockFeature}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PetchoSection() {
  const {
    pet, ready, isNew,
    petTheLizard, playWithBuddy, initPet,
  } = usePetcho();

  const [animState, setAnimState]       = useState<AnimationState>('idle');
  const [hint, setHint]                 = useState(HINT.idle);
  const [pulseBorder, setPulseBorder]   = useState(false);
  const [toast, setToast]               = useState<string | null>(null);
  const [showShare, setShowShare]       = useState(false);
  const [soundOn, setSoundOn]           = useState(true);
  const prevPetRef                      = useRef(pet);
  const seenUnlocks                     = useRef(new Set<string>());

  const isCritical    = pet.hunger < 15;
  const species       = pet.evolutionSpecies ?? null;
  const creatureDef   = species ? getCreature(species) : null;
  const habitat       = creatureDef?.habitat ?? 'bushland';
  const habitatTheme  = HABITAT_THEME[habitat];

  // Sync AudioEngine mute state
  useEffect(() => { AudioEngine.setMuted(!soundOn); }, [soundOn]);

  // Ambient sound: start when evolved (tier ≥ 2) and tab is active
  useEffect(() => {
    if (!ready || !species || !creatureDef) { AudioEngine.stopAmbient(); return; }
    const level = pet.level ?? 1;
    if (level < 3) { AudioEngine.stopAmbient(); return; } // Tier 2+ unlocks ambient
    AudioEngine.startAmbient(habitat);
    return () => AudioEngine.stopAmbient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, species, habitat, pet.level]);

  // Base state from pet conditions
  useEffect(() => {
    if (!ready) return;
    if (getSleepState()) { setAnimState('sleep'); setHint(HINT.sleep); return; }
    if (pet.hunger < 20 && animState === 'idle') {
      setAnimState('hungry'); setHint(HINT.hungry);
    }
  }, [ready, pet.hunger, animState]);

  // Idle hint with pet name
  useEffect(() => {
    if (animState === 'idle') setHint(`tap to interact with ${pet.name}`);
  }, [pet.name, animState]);

  // Evolution & milestone toasts
  useEffect(() => {
    const prev = prevPetRef.current;
    prevPetRef.current = pet;

    // Evolution unlock toast
    if (pet.level !== prev.level && pet.level >= 2 && pet.evolutionSpecies) {
      const def = getCreature(pet.evolutionSpecies);
      if (def) {
        const msg = `✨ Evolved into ${def.name}! [${def.rarity}] — ${def.unlockFeature}`;
        if (!seenUnlocks.current.has(msg)) {
          seenUnlocks.current.add(msg);
          setToast(msg);
          AudioEngine.playSound('levelUp');
        }
      }
    }

    // Other milestone toasts
    for (const check of UNLOCK_CHECKS) {
      const msg = check(pet.totalPets, pet.level);
      if (msg && !seenUnlocks.current.has(msg)) {
        if (pet.totalPets !== prev.totalPets || pet.level !== prev.level) {
          seenUnlocks.current.add(msg);
          setToast(msg);
          break;
        }
      }
    }
  }, [pet.totalPets, pet.level, pet.evolutionSpecies, pet]);

  const handlePet = useCallback(() => {
    const result = petTheLizard();
    setAnimState(result);
    setHint(HINT[result]);
    setPulseBorder(true);
    setTimeout(() => setPulseBorder(false), 180);
    if (species) AudioEngine.playSound(species);
  }, [petTheLizard, species]);

  const handlePlay = useCallback(() => {
    const result = playWithBuddy();
    setAnimState(result);
    setHint(HINT[result]);
    setPulseBorder(true);
    setTimeout(() => setPulseBorder(false), 180);
    if (species) AudioEngine.playSound(species);
  }, [playWithBuddy, species]);

  const handleFeedInfo = useCallback(() => {
    setToast(`Read a post to feed ${pet.name} — hunger decays fast! ↗`);
  }, [pet.name]);

  const handleAnimDone = useCallback(() => {
    const base: AnimationState = getSleepState()
      ? 'sleep'
      : pet.hunger < 20 ? 'hungry' : 'idle';
    setAnimState(base);
    setHint(base === 'idle' ? `tap to interact with ${pet.name}` : HINT[base]);
  }, [pet.hunger, pet.name]);

  if (!ready) return null;
  if (isNew)  return <PetCreator onDone={initPet} />;

  // ── Shell styling ──────────────────────────────────────────────────────────
  const shellBg = isCritical
    ? 'linear-gradient(160deg, #C84820 0%, #8A1E10 55%, #5A0C08 100%)'
    : 'linear-gradient(160deg, #E8693D 0%, #C04820 55%, #9A3015 100%)';
  const shellBorder = isCritical ? '#550808' : '#7A2C10';
  const shellShadow = isCritical
    ? `0 8px 0 #420808, 0 0 28px #FF000018, inset 0 2px 0 rgba(255,160,100,0.18)`
    : `0 8px 0 #5A1808, inset 0 2px 0 rgba(255,200,150,0.22)`;

  // Special action label for evolved creatures (tier 3+)
  const specialLabel = !species ? 'PLAY'
    : pet.level >= 4            ? (creatureDef?.id === 'sugarGlider' ? 'GLIDE'
                                  : creatureDef?.id === 'echidna'    ? 'CURL'
                                  : creatureDef?.id === 'tazDevil'   ? 'SCARE'
                                  : creatureDef?.id === 'numbat'     ? 'TONGUE'
                                  : 'PLAY')
    : 'PLAY';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>

      {/* ── Tamagotchi device shell ───────────────────────── */}
      <div style={{
        background:   shellBg,
        borderRadius: '22px 22px 52px 52px',
        padding:      '12px 12px 20px',
        border:       `3px solid ${shellBorder}`,
        boxShadow:    shellShadow,
        transition:   'background 0.3s, border-color 0.3s, box-shadow 0.3s',
        userSelect:   'none',
      }}>

        {/* Hint */}
        <div style={{
          textAlign: 'center', fontSize: '0.6rem',
          color:     isCritical ? '#FF9999' : 'rgba(255,200,150,0.55)',
          fontFamily:'"Courier New", monospace',
          marginBottom: '7px', minHeight: '1em', letterSpacing: '0.03em',
        }}>
          {'> '}{hint}
        </div>

        {/* CLI screen */}
        <div
          onClick={handlePet}
          style={{
            outline:      pulseBorder
              ? `2px solid ${isCritical ? '#FF3333' : habitatTheme.primary}`
              : '2px solid transparent',
            borderRadius: '6px', transition: 'outline 0.1s', cursor: 'pointer',
          }}
        >
          <HabitatScene
            petName={pet.name}
            hunger={pet.hunger}
            isCritical={isCritical}
            habitatTheme={species ? habitatTheme : undefined}
          >
            <HopperSprite animState={animState} pet={pet} onAnimDone={handleAnimDone} />
          </HabitatScene>
        </div>

        {/* Speaker dots + sound toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '6px 4px 0',
        }}>
          <div style={{ display: 'flex', gap: '3px', opacity: 0.28 }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: 'rgba(255,180,120,0.8)',
              }} />
            ))}
          </div>
          <button
            onClick={() => setSoundOn(s => !s)}
            title={soundOn ? 'Mute sounds' : 'Enable sounds'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.7rem', opacity: 0.5, padding: '0 2px',
              color: 'rgba(255,200,150,0.8)',
            }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '26px', marginTop: '10px',
        }}>
          <TamaBtn keyLabel="A" label="PET"      onClick={handlePet}      />
          <TamaBtn keyLabel="B" label="FEED"     onClick={handleFeedInfo} />
          <TamaBtn keyLabel="C" label={specialLabel} onClick={handlePlay} urgent={isCritical} />
        </div>
      </div>

      {/* ── Terminal stats ─────────────────────────────────── */}
      <HungerBar
        name={pet.name}
        hunger={pet.hunger}
        happiness={pet.happiness}
        level={pet.level}
        xp={pet.xp}
        totalPets={pet.totalPets}
        streak={pet.streak ?? 0}
        speciesName={creatureDef?.name}
      />

      {/* ── Creature info card (shown when evolved) ────────── */}
      {species && <CreatureCard speciesId={species} />}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{
          fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace',
        }}>
          {'>'} read posts to feed {pet.name} →
        </p>
        <button
          onClick={() => setShowShare(true)}
          style={{
            background: 'var(--warm-white)', border: '1.5px solid var(--ink)',
            borderRadius: '4px', boxShadow: '2px 2px 0 var(--ink)',
            padding: '0.28em 0.75em', fontSize: '0.65rem', fontWeight: 700,
            cursor: 'pointer', color: 'var(--brown-mid)',
            fontFamily: '"Courier New", monospace', flexShrink: 0,
          }}
        >
          share {species ? '🐾' : '🤖'}
        </button>
      </div>

      {toast    && <UnlockToast message={toast} onDone={() => setToast(null)} />}
      {showShare && <PetShareCard pet={pet} onClose={() => setShowShare(false)} />}
    </div>
  );
}
