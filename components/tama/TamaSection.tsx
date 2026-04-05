'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTama } from './useTama';
import TamaHatch from './TamaHatch';
import { SPECIES_NAME } from './types';

const TamaDevice = dynamic(() => import('./TamaDevice'), { ssr: false });

export default function TamaSection() {
  const {
    pet, ready, isNew, evolved,
    doFeedMeal, doFeedSnack, doToggleLight, doMedicine,
    doCleanToilet, doDiscipline, doAnswerCall, doPet,
    doGameResult, toggleMute, initPet, dismissEvolved,
  } = useTama();

  const [showEvolved, setShowEvolved] = useState<string | null>(null);

  useEffect(() => {
    if (evolved) {
      setShowEvolved(evolved);
      const t = setTimeout(() => { setShowEvolved(null); dismissEvolved(); }, 4000);
      return () => clearTimeout(t);
    }
  }, [evolved, dismissEvolved]);

  if (!ready) {
    return (
      <div style={{
        height: '260px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        fontFamily: '"Courier New", monospace',
      }}>
        loading…
      </div>
    );
  }

  if (isNew) {
    return <TamaHatch onDone={initPet} />;
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Evolution toast */}
      {showEvolved && (
        <div style={{
          position:     'absolute',
          top:          '-48px',
          left:         '50%',
          transform:    'translateX(-50%)',
          background:   'var(--warm-white)',
          border:       '2px solid var(--ink)',
          borderRadius: '6px',
          boxShadow:    '3px 3px 0 var(--ink)',
          padding:      '0.5rem 1rem',
          fontSize:     '0.85rem',
          fontWeight:   700,
          color:        'var(--brown-dark)',
          whiteSpace:   'nowrap',
          zIndex:       10,
          animation:    'fadeUp 0.3s ease',
        }}>
          ✨ Evolved into {SPECIES_NAME[showEvolved as keyof typeof SPECIES_NAME] ?? showEvolved}!
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translate(-50%,8px); } to { opacity:1; transform:translate(-50%,0); } }`}</style>
        </div>
      )}

      <TamaDevice
        pet={pet}
        onFeedMeal={doFeedMeal}
        onFeedSnack={doFeedSnack}
        onToggleLight={doToggleLight}
        onMedicine={doMedicine}
        onCleanToilet={doCleanToilet}
        onDiscipline={doDiscipline}
        onAnswerCall={doAnswerCall}
        onPet={doPet}
        onGameResult={doGameResult}
        onToggleMute={toggleMute}
      />

      {/* XP progress hint */}
      <div style={{
        marginTop:  '12px',
        padding:    '0.6rem 1rem',
        background: 'var(--warm-white)',
        border:     'var(--panel-border)',
        borderRadius: '6px',
        fontSize:   '0.75rem',
        color:      'var(--text-muted)',
        textAlign:  'center',
        maxWidth:   '260px',
        lineHeight: 1.6,
      }}>
        {pet.postsRead < 3 && pet.stage === 'child'
          ? `📖 Feed ${3 - pet.postsRead} more post${3 - pet.postsRead === 1 ? '' : 's'} to unlock Teen evolution`
          : pet.postsRead < 10 && pet.stage === 'teen'
          ? `📖 Feed ${10 - pet.postsRead} more post${10 - pet.postsRead === 1 ? '' : 's'} to unlock Adult evolution`
          : pet.stage === 'egg'
          ? '🥚 Hatching soon…'
          : pet.stage === 'angel'
          ? '😇 Your pet passed away. Click the egg again to start fresh.'
          : `📖 Reading posts = XP + food. Keep ${pet.name} thriving!`}
      </div>

      {/* Reset link for angel state */}
      {pet.stage === 'angel' && (
        <button
          onClick={() => {
            localStorage.removeItem('tama_pet');
            window.location.reload();
          }}
          style={{
            marginTop:  '8px',
            background: 'none',
            border:     'none',
            color:      'var(--text-muted)',
            fontSize:   '0.8rem',
            cursor:     'pointer',
            textDecoration: 'underline',
          }}
        >
          Start a new pet
        </button>
      )}
    </div>
  );
}
