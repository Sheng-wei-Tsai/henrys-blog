/**
 * City mascot illustrations for job card hover.
 * Each city gets an ink-brush silhouette that animates in from the bottom-right.
 * Design rule: one-stroke silhouette, rice-paper woodblock style, not caricature.
 */
import React from 'react';

type CityKey = 'sydney' | 'melbourne' | 'brisbane' | 'perth' | 'adelaide' | 'canberra' | 'remote' | 'australia';

const CITY_MAP: Record<string, CityKey> = {
  sydney:     'sydney',
  melbourne:  'melbourne',
  brisbane:   'brisbane',
  perth:      'perth',
  adelaide:   'adelaide',
  canberra:   'canberra',
  remote:     'remote',
  australia:  'australia',
};

function normalise(city: string): CityKey {
  return CITY_MAP[city.toLowerCase().trim()] ?? 'australia';
}

/* Each SVG is 80×80 viewBox */
function Sydney() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Harbour wave */}
      <path d="M5 65C15 60 25 68 35 63C45 58 55 66 75 62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      {/* Opera House — three shell sails */}
      <path d="M20 62C20 62 18 50 28 42C28 42 22 55 35 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 62C28 62 26 46 38 36C38 36 30 52 44 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 62C38 62 36 50 46 44C46 44 40 56 52 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Base platform */}
      <path d="M14 62H58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Sun ink dot above sails */}
      <circle cx="55" cy="22" r="3" fill="currentColor" opacity="0.7"/>
      <path d="M55 16V13M55 31V28M49 22H46M64 22H61M51 18L49 16M59 18L61 16M51 26L49 28M59 26L61 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function Melbourne() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Cobblestone ground line */}
      <path d="M5 68H75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      {/* Tram body */}
      <rect x="12" y="46" width="48" height="20" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      {/* Windows */}
      <rect x="18" y="51" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="33" y="51" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="48" y="51" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      {/* Roof stripe */}
      <path d="M12 50H60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Wheels */}
      <circle cx="24" cy="68" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="52" cy="68" r="4" stroke="currentColor" strokeWidth="2"/>
      {/* Overhead wire post */}
      <path d="M36 46V28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 28H70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Pantograph arm */}
      <path d="M36 46L30 36L36 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Spark dot */}
      <circle cx="36" cy="28" r="2" fill="currentColor"/>
    </svg>
  );
}

function Brisbane() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* River */}
      <path d="M5 70C20 65 30 72 45 67C55 64 65 70 75 68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
      {/* Story Bridge — two towers */}
      <path d="M20 68V35" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M60 68V35" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Arch cable array */}
      <path d="M20 35C25 18 55 18 60 35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Cable stays from peak */}
      <path d="M40 18L20 35M40 18L25 50M40 18L60 35M40 18L55 50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      {/* Road deck */}
      <path d="M12 58H68" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Light dots at tower tops */}
      <circle cx="20" cy="33" r="2" fill="currentColor"/>
      <circle cx="60" cy="33" r="2" fill="currentColor"/>
      {/* Peak dot */}
      <circle cx="40" cy="17" r="2.5" fill="currentColor"/>
    </svg>
  );
}

function Perth() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Water ripple */}
      <path d="M5 68C20 64 35 70 50 66C60 63 70 68 75 66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M10 72C22 69 38 74 55 70C62 68 70 72 75 70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
      {/* Swan body — filled silhouette */}
      <path d="M15 58C15 58 12 48 20 44C26 41 32 44 34 50C36 56 30 62 22 64C18 65 15 62 15 58Z" fill="currentColor" opacity="0.85"/>
      {/* Long elegant neck */}
      <path d="M30 48C30 48 38 42 48 36C54 32 60 28 58 22C56 18 50 18 46 22C42 26 40 34 40 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Head */}
      <circle cx="58" cy="20" r="5" fill="currentColor"/>
      {/* Beak */}
      <path d="M63 20L70 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Wing curve detail */}
      <path d="M16 54C20 50 26 52 28 56" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      {/* Eye dot */}
      <circle cx="60" cy="18" r="1.2" fill="white"/>
    </svg>
  );
}

function Adelaide() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Festival tent — three peaks */}
      <path d="M10 62L25 30L40 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 62L40 28L52 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 62L57 32L70 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Base ground */}
      <path d="M5 62H75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* String of lights between peaks */}
      <path d="M25 30C30 32 35 28 40 28C45 28 50 32 57 32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 3"/>
      {/* Light dots */}
      <circle cx="25" cy="30" r="2.5" fill="currentColor"/>
      <circle cx="40" cy="28" r="2.5" fill="currentColor"/>
      <circle cx="57" cy="32" r="2.5" fill="currentColor"/>
      {/* Wine glass */}
      <path d="M60 18V28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M56 20C56 20 55 14 60 14C65 14 64 20 64 20H56Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <path d="M57 27H63" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Bubble dot */}
      <circle cx="63" cy="16" r="1.2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

function Canberra() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Mountain silhouette */}
      <path d="M5 68L25 42L40 55L55 35L75 68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
      {/* Parliament building — stepped base */}
      <rect x="15" y="55" width="50" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="22" y="48" width="36" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="30" y="42" width="20" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      {/* Flagpole */}
      <path d="M40 42V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Flag */}
      <path d="M40 18L56 22L40 26V18Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      {/* Flag dot */}
      <circle cx="40" cy="16" r="2" fill="currentColor"/>
      {/* Columns detail */}
      <path d="M23 55V50M30 55V50M37 55V50M43 55V50M50 55V50M57 55V50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function Remote() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Paper plane */}
      <path d="M70 12L10 34L30 42L38 66L70 12Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Fold line */}
      <path d="M30 42L70 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Dashed flight trail */}
      <path d="M10 34L5 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3"/>
      <path d="M5 40L2 48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.5"/>
      {/* Trailing ink dots */}
      <circle cx="7" cy="38" r="1.5" fill="currentColor" opacity="0.7"/>
      <circle cx="4" cy="44" r="1.2" fill="currentColor" opacity="0.5"/>
      <circle cx="3" cy="50" r="1" fill="currentColor" opacity="0.3"/>
      {/* Wifi arcs above plane */}
      <path d="M52 8C56 5 64 5 68 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M55 13C57 11 63 11 65 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      {/* Signal dot */}
      <circle cx="60" cy="16" r="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

function Australia() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" role="presentation">
      {/* Kangaroo silhouette mid-hop */}
      {/* Hind legs / feet — ground contact */}
      <path d="M28 68C26 62 24 60 20 60C16 60 14 64 14 64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Tail — sweeping brush stroke */}
      <path d="M28 68C32 62 36 55 30 48C26 44 20 46 18 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Body */}
      <path d="M30 48C36 40 44 36 48 40C52 44 48 54 44 58C40 62 32 64 28 68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Front arm reaching forward (mid-hop) */}
      <path d="M48 40C52 36 58 34 60 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Neck */}
      <path d="M48 40C50 34 54 28 56 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Head */}
      <path d="M56 26C60 22 66 20 66 24C66 28 62 30 58 30C54 30 52 28 56 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Ear */}
      <path d="M62 22C63 18 67 16 68 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Eye ink dot */}
      <circle cx="63" cy="25" r="1.8" fill="currentColor"/>
      {/* Dust puff dots at feet */}
      <circle cx="18" cy="66" r="1.2" fill="currentColor" opacity="0.4"/>
      <circle cx="14" cy="70" r="1" fill="currentColor" opacity="0.3"/>
    </svg>
  );
}

const CITY_ICONS: Record<CityKey, React.FC> = {
  sydney:    Sydney,
  melbourne: Melbourne,
  brisbane:  Brisbane,
  perth:     Perth,
  adelaide:  Adelaide,
  canberra:  Canberra,
  remote:    Remote,
  australia: Australia,
};

interface CityIconProps {
  city: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CityIcon({ city, size = 80, className, style }: CityIconProps) {
  const key = normalise(city);
  const Icon = CITY_ICONS[key];
  return (
    <div
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
    >
      <Icon />
    </div>
  );
}
