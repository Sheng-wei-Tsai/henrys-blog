/**
 * Eastern-animated ink icon system — TechPath AU
 * Design language: 2.5px brush strokes · round caps/joins · one ink-blob
 * personality detail per icon · currentColor so callers control hue.
 */
import React from 'react';

export type EIconName =
  | 'briefcase' | 'resume' | 'target' | 'books' | 'map' | 'chart'
  | 'brush' | 'robot' | 'fire' | 'passport' | 'wave' | 'card'
  | 'sparkle' | 'sparkles' | 'trophy' | 'coin' | 'scale' | 'rocket'
  | 'cap' | 'plane' | 'newspaper' | 'bell' | 'heart' | 'heart-filled'
  | 'pencil-letter' | 'tick' | 'person' | 'bolt' | 'magnifier' | 'close'
  | 'video' | 'github' | 'tag' | 'clock';

interface EIconProps {
  name: EIconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export default function EIcon({ name, size = 18, className, style, ...rest }: EIconProps) {
  const s = 2.5;

  function Dot({ cx, cy, r = 1.3 }: { cx: number; cy: number; r?: number }) {
    return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
  }

  let paths: React.ReactNode = null;

  switch (name) {

    /* ── Career tools ─────────────────────────────────────────────────── */

    case 'briefcase':
      paths = (
        <>
          <path d="M9 7V5.5C9 4.7 9.4 4 10 4H14C14.6 4 15 4.7 15 5.5V7" strokeWidth={s} />
          <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={s} />
          <path d="M3 13.5H21" strokeWidth="1.5" />
          <Dot cx={10.5} cy={13.5} />
          <Dot cx={13.5} cy={13.5} />
        </>
      );
      break;

    case 'resume':
      paths = (
        <>
          <path d="M5 3H16L19 6V21H5V3Z" strokeWidth={s} />
          <path d="M16 3V6H19" strokeWidth="1.5" />
          <path d="M8 10H16M8 13H14M8 16H11" strokeWidth="1.5" />
          <Dot cx={13} cy={16} r={1.2} />
        </>
      );
      break;

    case 'target':
      paths = (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth={s} />
          <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
          <path d="M18 6L13.5 10.5" strokeWidth={s} />
          <path d="M15 6H18V9" strokeWidth={s} />
          <Dot cx={12} cy={12} r={1.8} />
        </>
      );
      break;

    case 'books':
      paths = (
        <>
          <rect x="3.5" y="10" width="5" height="11" rx="1" strokeWidth={s} />
          <rect x="10" y="8" width="5" height="13" rx="1" strokeWidth={s} />
          <path d="M8 7.5L18 5.5L18.5 9L8.5 11Z" strokeWidth="2" />
          <Dot cx={12.5} cy={14} r={1.2} />
        </>
      );
      break;

    case 'map':
      paths = (
        <>
          <path d="M2 5L9 3L15 5.5L22 3.5V19L15 21L9 18.5L2 20.5V5Z" strokeWidth={s} />
          <path d="M9 3V18.5M15 5.5V21" strokeWidth="1.5" />
          <circle cx="11" cy="11" r="2" strokeWidth="2" fill="none" />
          <Dot cx={11} cy={11} r={0.8} />
        </>
      );
      break;

    case 'chart':
      paths = (
        <>
          <rect x="3" y="14" width="4" height="7" rx="1" strokeWidth={s} />
          <rect x="10" y="10" width="4" height="11" rx="1" strokeWidth={s} />
          <rect x="17" y="6" width="4" height="15" rx="1" strokeWidth={s} />
          <path d="M3 14C5 8 19 4 21 6" strokeWidth="1.5" fill="none" />
          <Dot cx={21} cy={5} r={1.4} />
        </>
      );
      break;

    /* ── Content ──────────────────────────────────────────────────────── */

    case 'brush':
      paths = (
        <>
          <path d="M8 3L15 10" strokeWidth={s} />
          <path d="M13.5 9.5L14.5 10.5" strokeWidth="4" strokeLinecap="round" />
          <path d="M15.5 12C17 13.5 19 16 18.5 17.5C18 19 16 19 14.5 18C13 17 11 14.5 12 12.5C13 10.5 14.5 11 15.5 12Z" strokeWidth={s} />
          <Dot cx={17.5} cy={19.5} r={1.5} />
        </>
      );
      break;

    case 'robot':
      paths = (
        <>
          <rect x="6" y="8" width="12" height="10" rx="2" strokeWidth={s} />
          <path d="M12 5V8" strokeWidth={s} />
          <circle cx="12" cy="4" r="1.5" strokeWidth="2" fill="none" />
          <rect x="8" y="11" width="2.5" height="2.5" rx="0.5" strokeWidth="1.5" />
          <rect x="13.5" y="11" width="2.5" height="2.5" rx="0.5" strokeWidth="1.5" />
          <path d="M9 15.5C10 17 14 17 15 15.5" strokeWidth="1.5" />
          <Dot cx={15} cy={4.5} r={0.9} />
        </>
      );
      break;

    case 'fire':
      paths = (
        <>
          <path d="M12 21C7.5 21 5 17.5 6 13C6.5 10.5 9 9 9 6C11 9 10 11 11 12C12 10 13 8 12.5 5C15.5 8 16.5 12 15.5 14C15 15.5 16 17 16 18.5" strokeWidth={s} />
          <path d="M12 18C10.5 18 9.5 16 10 14C10.5 12.5 12 12 12 12" strokeWidth="1.5" />
          <Dot cx={15.5} cy={19.5} r={1.3} />
        </>
      );
      break;

    case 'passport':
      paths = (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth={s} />
          <path d="M10 3V21" strokeWidth="1.5" />
          <ellipse cx="15" cy="12" rx="4" ry="3" strokeWidth="1.5" />
          <Dot cx={15} cy={12} r={1} />
          <path d="M5.5 8H8.5M5.5 11H8.5M5.5 14H8.5" strokeWidth="1.5" />
        </>
      );
      break;

    case 'wave':
      paths = (
        <>
          <path d="M8 13V8C8 7.4 8.4 7 9 7C9.6 7 10 7.4 10 8V12" strokeWidth={s} />
          <path d="M10 11V7C10 6.4 10.4 6 11 6C11.6 6 12 6.4 12 7V11" strokeWidth={s} />
          <path d="M12 11V8C12 7.4 12.4 7 13 7C13.6 7 14 7.4 14 8V11" strokeWidth={s} />
          <path d="M14 11V9C14 8.4 14.4 8 15 8C15.6 8 16 8.4 16 9V14C16 17.3 13.3 20 10 20C7.8 20 6 18.2 6 16V13C6 12.4 6.4 12 7 12H8" strokeWidth={s} />
          <path d="M18 9C18.8 10.5 18.8 12.5 18 14" strokeWidth="1.5" />
          <Dot cx={18.5} cy={7.5} r={1} />
        </>
      );
      break;

    case 'card':
      paths = (
        <>
          <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={s} />
          <path d="M2 9H22" strokeWidth="3.5" strokeLinecap="butt" />
          <rect x="5" y="12" width="5" height="4" rx="1" strokeWidth="1.5" />
          <Dot cx={13} cy={14} r={1.2} />
        </>
      );
      break;

    /* ── Navigation / chrome ──────────────────────────────────────────── */

    case 'sparkle':
      paths = (
        <>
          <path d="M12 3V8M12 16V21M3 12H8M16 12H21" strokeWidth="2" />
          <path d="M6.5 6.5L9.5 9.5M14.5 14.5L17.5 17.5M17.5 6.5L14.5 9.5M9.5 14.5L6.5 17.5" strokeWidth="1.5" />
          <Dot cx={12} cy={12} r={2} />
        </>
      );
      break;

    case 'sparkles':
      paths = (
        <>
          <path d="M12 4L13 8L17 9L13 10L12 14L11 10L7 9L11 8Z" strokeWidth="1.5" />
          <path d="M18 3L18.6 5L21 5.7L18.6 6.4L18 8.5L17.4 6.4L15 5.7L17.4 5Z" strokeWidth="1.5" />
          <Dot cx={6} cy={17} r={1.5} />
        </>
      );
      break;

    case 'trophy':
      paths = (
        <>
          <path d="M6 4H18V12C18 15.3 15.3 18 12 18C8.7 18 6 15.3 6 12V4Z" strokeWidth={s} />
          <path d="M6 7H4C4 10 5.5 11.5 6 11" strokeWidth="2" />
          <path d="M18 7H20C20 10 18.5 11.5 18 11" strokeWidth="2" />
          <path d="M12 18V21" strokeWidth={s} />
          <path d="M8 21H16" strokeWidth={s} />
          <Dot cx={9.5} cy={8} r={1.2} />
        </>
      );
      break;

    case 'coin':
      paths = (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth={s} />
          <path d="M12 7V17M9.5 9.5H14.5M9.5 12H14.5" strokeWidth="2" />
          <Dot cx={8} cy={8} r={1.2} />
        </>
      );
      break;

    case 'scale':
      paths = (
        <>
          <path d="M12 4V20" strokeWidth={s} />
          <path d="M5 8H19" strokeWidth={s} />
          <path d="M5 8C5 8 4 12 6 12C8 12 9 8 9 8" strokeWidth="2" />
          <path d="M15 8C15 8 15.5 11 17.5 10.5C19.5 10 19 8 19 8" strokeWidth="2" />
          <path d="M9 20H15" strokeWidth={s} />
          <Dot cx={6} cy={11.5} r={0.9} />
          <Dot cx={17} cy={10} r={0.9} />
        </>
      );
      break;

    case 'rocket':
      paths = (
        <>
          <path d="M12 3C12 3 17 7 17 13L12 20L7 13C7 7 12 3 12 3Z" strokeWidth={s} />
          <path d="M7 13L4 16L7 16" strokeWidth="2" />
          <path d="M17 13L20 16L17 16" strokeWidth="2" />
          <circle cx="12" cy="10.5" r="2.5" strokeWidth="1.5" fill="none" />
          <Dot cx={12} cy={21.5} r={1.5} />
          <Dot cx={10} cy={20.5} r={1} />
          <Dot cx={14} cy={20.5} r={1} />
        </>
      );
      break;

    case 'cap':
      paths = (
        <>
          <path d="M12 5L22 10L12 15L2 10Z" strokeWidth={s} />
          <path d="M6 12V17C8 19.5 16 19.5 18 17V12" strokeWidth={s} />
          <path d="M22 10V14" strokeWidth={s} />
          <path d="M22 14C22 14 21 16 20 17" strokeWidth="2" />
          <Dot cx={19.5} cy={17.5} r={1.3} />
        </>
      );
      break;

    case 'plane':
      paths = (
        <>
          <path d="M22 3L3 10.5L12 13.5L15 22L22 3Z" strokeWidth={s} />
          <path d="M12 13.5L22 3" strokeWidth="1.5" />
          <path d="M3 10.5L7 12" strokeWidth="1.5" strokeDasharray="2 2" />
          <Dot cx={2.5} cy={13} r={1.2} />
        </>
      );
      break;

    case 'newspaper':
      paths = (
        <>
          <path d="M4 3H17L20 6V21H4V3Z" strokeWidth={s} />
          <path d="M17 3V6H20" strokeWidth="1.5" />
          <path d="M7 8H17" strokeWidth="3" />
          <path d="M7 12H13M7 14.5H15M7 17H12" strokeWidth="1.5" />
          <Dot cx={16} cy={14} r={1.3} />
        </>
      );
      break;

    case 'bell':
      paths = (
        <>
          <path d="M6 17V12C6 8.7 8.7 6 12 6C15.3 6 18 8.7 18 12V17H6Z" strokeWidth={s} />
          <path d="M4 17H20" strokeWidth={s} />
          <path d="M12 3V6" strokeWidth={s} />
          <circle cx="12" cy="20" r="1.8" strokeWidth="2" fill="none" />
          <Dot cx={12} cy={20} r={0.7} />
        </>
      );
      break;

    case 'heart':
      paths = (
        <path d="M12 21C12 21 4 15 4 9C4 6.2 6.2 4 9 4C10.5 4 11.7 4.8 12 5.5C12.3 4.8 13.5 4 15 4C17.8 4 20 6.2 20 9C20 15 12 21 12 21Z" strokeWidth={s} />
      );
      break;

    case 'heart-filled':
      paths = (
        <path d="M12 21C12 21 4 15 4 9C4 6.2 6.2 4 9 4C10.5 4 11.7 4.8 12 5.5C12.3 4.8 13.5 4 15 4C17.8 4 20 6.2 20 9C20 15 12 21 12 21Z" strokeWidth={s} fill="currentColor" />
      );
      break;

    case 'pencil-letter':
      paths = (
        <>
          <rect x="3" y="8" width="18" height="13" rx="2" strokeWidth={s} />
          <path d="M3 10L12 16L21 10" strokeWidth="2" />
          <path d="M15 4.5L18.5 8L17 9.5L13.5 6Z" strokeWidth="2" />
          <path d="M13.5 6L12.5 8" strokeWidth="2" />
          <Dot cx={12} cy={8.5} r={1} />
        </>
      );
      break;

    case 'tick':
      paths = (
        <>
          <path d="M4 13L9 18L20 6" strokeWidth="3" />
          <Dot cx={4} cy={13} r={1.5} />
        </>
      );
      break;

    case 'person':
      paths = (
        <>
          <circle cx="12" cy="8" r="4.5" strokeWidth={s} />
          <path d="M4.5 21C4.5 17 8 14 12 14C16 14 19.5 17 19.5 21" strokeWidth={s} />
          <Dot cx={10.3} cy={8} r={1} />
          <Dot cx={13.7} cy={8} r={1} />
        </>
      );
      break;

    case 'bolt':
      paths = (
        <>
          <path d="M13 3L6 13.5H12L11 21L18 10.5H12L13 3Z" strokeWidth={s} />
          <Dot cx={11.5} cy={21.5} r={1.3} />
        </>
      );
      break;

    case 'magnifier':
      paths = (
        <>
          <circle cx="10.5" cy="10.5" r="7" strokeWidth={s} />
          <path d="M10.5 6.5V14.5" strokeWidth="1.2" opacity="0.45" />
          <path d="M6.5 10.5H14.5" strokeWidth="1.2" opacity="0.45" />
          <Dot cx={10.5} cy={10.5} r={1.3} />
          <path d="M16 16L21 21" strokeWidth="3" />
        </>
      );
      break;

    case 'close':
      paths = (
        <>
          <path d="M5 5L19 19" strokeWidth="3" />
          <path d="M19 5L5 19" strokeWidth="2.5" />
          <Dot cx={12} cy={12} r={1.3} />
        </>
      );
      break;

    case 'video':
      paths = (
        <>
          <rect x="3" y="6" width="14" height="12" rx="2" strokeWidth={s} />
          <path d="M9 9L14 12L9 15V9Z" fill="currentColor" stroke="none" />
          <path d="M17 9L21 7V17L17 15" strokeWidth={s} />
          <Dot cx={6} cy={7.5} r={1} />
        </>
      );
      break;

    case 'github':
      paths = (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth={s} />
          <path d="M9 17C9 17 9 14.5 12 14.5C15 14.5 15 17 15 17" strokeWidth="2" />
          <path d="M9 11C9 9.5 10 8 12 8C14 8 15 9.5 15 11" strokeWidth="2" />
          <Dot cx={10.5} cy={11} r={1} />
          <Dot cx={13.5} cy={11} r={1} />
        </>
      );
      break;

    case 'tag':
      paths = (
        <>
          <path d="M5 3H16.5L21 12L16.5 21H5V3Z" strokeWidth={s} />
          <circle cx="8.5" cy="12" r="1.8" strokeWidth="2" fill="none" />
          <Dot cx={4} cy={12} r={1.3} />
          <path d="M12 8H18M12 12H17M12 16H15.5" strokeWidth="1.5" />
        </>
      );
      break;

    case 'clock':
      paths = (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth={s} />
          <path d="M12 12L9 7" strokeWidth={s} />
          <path d="M12 12V6" strokeWidth="2" />
          <Dot cx={12} cy={12} r={1.5} />
        </>
      );
      break;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden={rest['aria-hidden'] ?? 'true'}
    >
      {paths}
    </svg>
  );
}
