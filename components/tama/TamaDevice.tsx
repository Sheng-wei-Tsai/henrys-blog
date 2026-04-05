'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import TamaScreen from './TamaScreen';
import { TamaState, AnimState, SPECIES_NAME, STAGE_LABEL } from './types';
import { GameDrawState } from './sprites';
import { TamaAudio } from './sounds';

/* ── Dracula-ish 90s terminal palette ──────────────────────────────────────── */
const C = {
  bg:     '#0d1117',
  panel:  '#161b22',
  border: '#30363d',
  bar:    '#090d13',
  text:   '#e6edf3',
  dim:    '#6e7681',
  green:  '#3fb950',
  gold:   '#d29922',
  blue:   '#58a6ff',
  purple: '#bc8cff',
  red:    '#f85149',
  cyan:   '#39d353',
  prompt: '#3fb950',   // bright green prompt like classic terminal
};

type L = { t: 'cmd'|'ok'|'err'|'info'|'sys'; s: string };
type GS = GameDrawState;

const freshGame = (): GS => ({
  direction: (Math.random() < 0.5 ? 'left' : 'right') as 'left'|'right',
  revealed: false, playerGuess: null, round: 1, wins: 0,
});

const PILLS = [
  { cmd: 'feed',   label: '🍽 feed',   col: C.green  },
  { cmd: 'pet',    label: '♥ pet',    col: C.red    },
  { cmd: 'play',   label: '🎮 play',  col: C.blue   },
  { cmd: 'status', label: '📊 stat',  col: C.purple },
  { cmd: 'clean',  label: '🧹 clean', col: C.gold   },
  { cmd: 'help',   label: '? help',   col: C.dim    },
];

interface Props {
  pet:           TamaState; onFeedMeal: ()=>void; onFeedSnack: ()=>void;
  onToggleLight: ()=>void;  onMedicine: ()=>void; onCleanToilet: ()=>void;
  onDiscipline:  ()=>void;  onAnswerCall: ()=>void; onPet: ()=>void;
  onGameResult:  (w: boolean)=>void; onToggleMute: ()=>void;
}

export default function TamaDevice({
  pet, onFeedMeal, onFeedSnack, onToggleLight, onMedicine,
  onCleanToilet, onDiscipline, onAnswerCall, onPet, onGameResult, onToggleMute,
}: Props) {
  const [anim, setAnim] = useState<AnimState>('idle');
  const [msg,  setMsg]  = useState('');
  const [game, setGame] = useState<GS|null>(null);
  const [inp,  setInp]  = useState('');
  const [log,  setLog]  = useState<L[]>([
    { t:'sys', s:'tamaaussie v2  ·  type help' },
    { t:'info', s:`${'\u25b6'} ${pet.name} is alive!` },
  ]);
  const [hist, setHist]       = useState<string[]>([]);
  const [hIdx, setHIdx]       = useState(-1);
  const endRef  = useRef<HTMLDivElement>(null);
  const inpRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pet.stage==='angel') { setAnim('dead'); return; }
    if (pet.sleeping)        { setAnim('sleeping'); return; }
    if (pet.sick)            { setAnim('sick'); return; }
    if (pet.callPending)     { setAnim('attention'); return; }
    setAnim('idle');
  }, [pet.stage, pet.sleeping, pet.sick, pet.callPending]);

  useEffect(() => { endRef.current?.scrollIntoView({ block:'nearest' }); }, [log]);

  const flash = (a: AnimState, m?: string) => {
    setAnim(a); if (m) setMsg(m);
    setTimeout(() => { setAnim('idle'); setMsg(''); }, 1100);
  };
  const push = (...lines: L[]) => setLog(l => [...l, ...lines]);

  const run = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    push({ t:'cmd', s:`❯ ${raw.trim()}` });
    setHist(h => [raw.trim(), ...h.slice(0,29)]);
    setHIdx(-1);

    if (pet.stage==='angel') { push({ t:'err', s:'pet passed away.' }); return; }

    /* ── in game ── */
    if (game && !game.revealed) {
      if (cmd==='quit') { setGame(null); push({ t:'sys', s:'quit.' }); return; }
      const left = cmd==='left'||cmd==='l';
      const right = cmd==='right'||cmd==='r';
      if (!left && !right) { push({ t:'info', s:"left / right / quit" }); return; }
      const correct = left ? game.direction==='left' : game.direction==='right';
      const wins = game.wins + (correct?1:0);
      const round = game.round;
      setGame({...game, revealed:true, playerGuess: left?'left':'right'});
      onGameResult(correct);
      TamaAudio.play('btn');
      push({ t: correct?'ok':'err', s: correct?'✓ correct!':'✗ wrong.' });
      setTimeout(() => {
        if (round>=5||wins>=3) {
          setGame(null); flash('happy', wins>=3?'🏆':'done');
          push({ t: wins>=3?'ok':'info', s:`game over — ${wins}/5 wins` });
        } else {
          setGame({...freshGame(), round:round+1, wins});
          push({ t:'info', s:`round ${round+1}/5 · left or right?` });
        }
      }, 700);
      return;
    }

    switch(cmd) {
      case 'help': case 'h': case '?':
        push(
          { t:'info', s:'feed  snack  pet  play  status' },
          { t:'info', s:'medicine  clean  discipline' },
          { t:'info', s:'sleep  mute  clear' },
        ); break;
      case 'feed': case 'meal':
        if (pet.hunger>=4) { push({t:'info',s:'full already.'}); break; }
        if (pet.sleeping)  { push({t:'info',s:'sleeping…'}); break; }
        onFeedMeal(); flash('eating','Yum!'); TamaAudio.play('btn');
        push({t:'ok', s:`fed ${pet.name} ♥ hunger up`}); break;
      case 'snack': case 'treat':
        if (pet.sleeping) { push({t:'info',s:'sleeping…'}); break; }
        onFeedSnack(); flash('eating','Yay!'); TamaAudio.play('btn');
        push({t:'ok', s:'snack! happy up ♥'}); break;
      case 'pet': case 'cuddle':
        if (pet.sleeping) { push({t:'info',s:'shh, sleeping'}); break; }
        onPet(); flash('happy','♥'); TamaAudio.play('btn');
        push({t:'ok', s:`${pet.name} loved it ♥`}); break;
      case 'play': case 'game':
        if (pet.sleeping) { push({t:'info',s:'sleeping…'}); break; }
        setGame(freshGame());
        push({t:'info', s:"🎮 left or right? (or 'quit')"}); break;
      case 'status': case 'stat': {
        const h = (n:number) => '♥'.repeat(n)+'♡'.repeat(4-n);
        push(
          {t:'info', s:`── ${pet.name}  ${STAGE_LABEL[pet.stage]}  ${SPECIES_NAME[pet.species]??''} ──`},
          {t:'ok',   s:`hunger ${h(pet.hunger)}  happy ${h(pet.happiness)}`},
          {t:'info', s:`xp ${pet.xp}  posts ${pet.postsRead}  poop ${pet.poopCount?'💩'.repeat(pet.poopCount):'✓'}`},
        ); break;
      }
      case 'medicine': case 'med':
        if (!pet.sick) { push({t:'info',s:'not sick.'}); break; }
        onMedicine(); flash('happy','💊'); TamaAudio.play('btn');
        push({t:'ok', s:'medicine given'}); break;
      case 'clean': case 'toilet':
        if (!pet.poopCount) { push({t:'info',s:'nothing to clean ✓'}); break; }
        onCleanToilet(); flash('happy','✨'); TamaAudio.play('btn');
        push({t:'ok', s:'cleaned! ✨'}); break;
      case 'discipline': case 'scold':
        if (!pet.callPending) { push({t:'info',s:'behaving well.'}); break; }
        onDiscipline(); flash(pet.callIsReal?'sick':'happy', pet.callIsReal?'oops':'good!');
        TamaAudio.play('btn');
        push({t: pet.callIsReal?'err':'ok', s: pet.callIsReal?'was a real need!':'disciplined.'}); break;
      case 'answer': case 'call':
        if (!pet.callPending) { push({t:'info',s:'no call.'}); break; }
        onAnswerCall(); flash('happy','📞'); TamaAudio.play('btn');
        push({t:'ok', s:'answered ♥'}); break;
      case 'sleep': case 'light':
        onToggleLight(); TamaAudio.play('btn');
        push({t:'info', s: pet.sleeping?'🌅 lights on':'🌙 lights off'}); break;
      case 'mute': case 'sound':
        onToggleMute();
        push({t:'info', s: pet.muted?'🔊 on':'🔇 muted'}); break;
      case 'clear': case 'cls':
        setLog([]); break;
      default:
        push({t:'err', s:`not found: ${cmd}`});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet, game, onFeedMeal, onFeedSnack, onToggleLight, onMedicine,
      onCleanToilet, onDiscipline, onAnswerCall, onPet, onGameResult, onToggleMute]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key==='Enter') { run(inp); setInp(''); }
    else if (e.key==='ArrowUp')   { e.preventDefault(); setHIdx(i=>{const n=Math.min(i+1,hist.length-1); if(hist[n]) setInp(hist[n]); return n;}); }
    else if (e.key==='ArrowDown') { e.preventDefault(); setHIdx(i=>{const n=Math.max(i-1,-1); setInp(n===-1?'':hist[n]??''); return n;}); }
  };

  const lCol = (t:L['t']) => t==='cmd'?C.prompt : t==='ok'?C.green : t==='err'?C.red : t==='sys'?C.dim : C.text;
  const mono = "'JetBrains Mono','Fira Code','Courier New',monospace";

  return (
    <div style={{fontFamily: mono}} onClick={() => inpRef.current?.focus()}>
      <div style={{
        background: C.bg, borderRadius: 8,
        border: `1px solid ${C.border}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        width: '100%', maxWidth: 560, overflow: 'hidden',
      }}>

        {/* ── title bar ────────────────────────────────────────── */}
        <div style={{ background:C.bar, padding:'6px 10px', display:'flex', alignItems:'center', gap:6, borderBottom:`1px solid ${C.border}` }}>
          {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
            <div key={i} style={{width:9,height:9,borderRadius:'50%',background:c}}/>
          ))}
          <span style={{flex:1,textAlign:'center',fontSize:'0.62rem',color:C.dim,letterSpacing:'0.06em'}}>
            {pet.name.toLowerCase()}@buddy — tamaaussie
          </span>
          <button onClick={e=>{e.stopPropagation();onToggleMute();}}
            style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.68rem',padding:0,color:C.dim}}>
            {pet.muted?'🔇':'🔊'}
          </button>
        </div>

        {/* ── main row: screen | terminal ──────────────────────── */}
        <div style={{display:'flex', alignItems:'stretch'}}>

          {/* left: pixel screen */}
          <div style={{
            background:'#0a0e06', borderRight:`1px solid ${C.border}`,
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', padding:'8px',
            cursor:'pointer', flexShrink:0, position:'relative',
          }}
            onClick={e=>{e.stopPropagation(); if(pet.stage!=='egg'&&!pet.sleeping){onPet();flash('happy','♥');push({t:'ok',s:`♥ ${pet.name} loved it`});}}}
          >
            <TamaScreen state={pet} anim={anim} selectedMenu={0} showStatus={false} gameState={game??undefined} message={msg}/>
            {/* scanlines */}
            <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,0.12) 1px,rgba(0,0,0,0.12) 2px)'}}/>
            {/* name under screen */}
            <div style={{fontSize:'0.58rem',color:'#3a5a20',marginTop:4,letterSpacing:'0.08em',fontWeight:700}}>
              {pet.name.toUpperCase()}
            </div>
          </div>

          {/* right: terminal */}
          <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>

            {/* pills row */}
            <div style={{display:'flex',gap:4,padding:'5px 8px',background:C.panel,borderBottom:`1px solid ${C.border}`,flexWrap:'wrap'}}>
              {PILLS.map(({cmd,label,col})=>(
                <button key={cmd} onClick={e=>{e.stopPropagation();run(cmd);inpRef.current?.focus();}}
                  style={{background:`${col}14`,border:`1px solid ${col}38`,borderRadius:4,padding:'1px 7px',fontSize:'0.6rem',fontFamily:mono,color:col,cursor:'pointer'}}>
                  {label}
                </button>
              ))}
            </div>

            {/* attention banner */}
            {(pet.callPending||(game&&!game.revealed)) && (
              <div style={{padding:'2px 8px',fontSize:'0.6rem',color:C.gold,background:`${C.gold}12`,borderBottom:`1px solid ${C.gold}30`}}>
                {pet.callPending
                  ? `⚠ ${pet.name} needs you! → answer / discipline`
                  : `🎮 round ${game!.round}/5 wins:${game!.wins} → left or right`}
              </div>
            )}

            {/* log */}
            <div style={{flex:1,overflowY:'auto',padding:'5px 8px 2px',fontSize:'0.65rem',lineHeight:1.55,minHeight:110,maxHeight:155,scrollbarWidth:'thin',scrollbarColor:`${C.dim} transparent`}}>
              {log.map((l,i)=>(
                <div key={i} style={{color:lCol(l.t),whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{l.s}</div>
              ))}
              <div ref={endRef}/>
            </div>

            {/* prompt */}
            <div style={{borderTop:`1px solid ${C.border}`,padding:'5px 8px',display:'flex',alignItems:'center',gap:5,background:C.panel}}>
              <span style={{color:C.prompt,fontSize:'0.65rem',flexShrink:0}}>{pet.name.toLowerCase()}@buddy ~$</span>
              <input ref={inpRef} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={onKey}
                placeholder="command…" autoComplete="off" autoCorrect="off" spellCheck={false}
                style={{flex:1,background:'transparent',border:'none',outline:'none',color:C.text,fontSize:'0.65rem',fontFamily:mono,caretColor:C.prompt}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
