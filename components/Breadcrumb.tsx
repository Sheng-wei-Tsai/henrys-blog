'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  /* ── Prepare zone ── */
  'resume':           'Resume Analyser',
  'resume-analyser':  'Resume Analyser',
  'cover-letter':     'Cover Letter',
  'interview-prep':   'Interview Prep',
  'networking':       'Networking',
  'learn':            'Learn',
  'claude-code':      'Claude Code Guide',
  'youtube':          'YouTube Learning',
  'ibm':              'IBM Learning',
  'github':           'GitHub Learning',
  'diagrams':         'Diagrams',
  'junior-frontend':  'Frontend Path',
  'junior-fullstack': 'Fullstack Path',
  'junior-backend':   'Backend Path',
  'data-engineer':    'Data Engineer Path',
  'devops-cloud':     'DevOps / Cloud Path',
  /* ── Search zone ── */
  'jobs':             'Job Search',
  'au-insights':      'AU Insights',
  'companies':        'Companies',
  'grad-programs':    'Grad Programs',
  'salary-checker':   'Salary Checker',
  'blog':             'Blog',
  'digest':           'Research',
  'githot':           'GitHub Hot',
  'ai-news':          'AI News',
  'visa-news':        'Visa News',
  'posts':            'Posts',
  'research':         'Research',
  /* ── Track zone ── */
  'dashboard':        'Dashboard',
  'visa-tracker':     'Visa Tracker',
  'profile':          'Profile',
  /* ── Other ── */
  'post-a-role':      'Post a Role',
  'success':          'Success',
  'admin':            'Admin',
  'analytics':        'Analytics',
  'comments':         'Comments',
  'users':            'Users',
  'job-listings':     'Job Listings',
};

/* Which zone does a top-level segment belong to? */
const ZONE: Record<string, string> = {
  'resume':         'Prepare',
  'cover-letter':   'Prepare',
  'interview-prep': 'Prepare',
  'learn':          'Prepare',
  'jobs':           'Search',
  'au-insights':    'Search',
  'githot':         'Search',
  'digest':         'Search',
  'posts':          'Search',
  'blog':           'Search',
  'ai-news':        'Search',
  'visa-news':      'Search',
  'dashboard':      'Track',
};

/* Exact paths that never need breadcrumbs (auth flows, etc.) */
const SKIP_EXACT = new Set(['/auth/callback']);

/* Top-level segments that never produce pages visible to users */
const SKIP_SEGMENT = new Set(['api', 'auth']);

export default function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  if (SKIP_EXACT.has(pathname)) return null;
  if (SKIP_SEGMENT.has(segments[0])) return null;

  const zone = ZONE[segments[0]];

  let cumulativePath = '';
  const pageCrumbs: { label: string; href: string }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    cumulativePath += '/' + seg;
    const label = LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    pageCrumbs.push({ label, href: cumulativePath });
  }

  return (
    <nav aria-label="Breadcrumb" style={{
      maxWidth: '760px', margin: '0 auto', padding: '0.6rem 1.5rem 0',
    }}>
      <ol style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.15rem',
        listStyle: 'none', margin: 0, padding: 0,
        fontSize: '0.73rem', color: 'var(--text-muted)',
      }}>
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        </li>

        {zone && (
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <Separator />
            <span style={{ fontWeight: 500, color: 'var(--text-muted)', opacity: 0.7 }}>{zone}</span>
          </li>
        )}

        {pageCrumbs.map((crumb, i) => {
          const isLast = i === pageCrumbs.length - 1;
          return (
            <li key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <Separator />
              {isLast ? (
                <span style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Separator() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55 }}>
      <path d="M3.5 2.5L7.5 6L3.5 9.5" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="3" cy="6" r="1" fill="var(--text-muted)"/>
    </svg>
  );
}
