'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  'learn':           'Learn',
  'claude-code':     'Claude Code Guide',
  'youtube':         'YouTube Learning',
  'ibm':             'IBM Learning',
  'junior-frontend': 'Frontend Path',
  'junior-fullstack': 'Fullstack Path',
  'junior-backend':  'Backend Path',
  'data-engineer':   'Data Engineer Path',
  'devops-cloud':    'DevOps / Cloud Path',
  'au-insights':     'AU Insights',
  'companies':       'Companies',
  'grad-programs':   'Grad Programs',
  'salary-checker':  'Salary Checker',
  'jobs':            'Job Search',
  'interview-prep':  'Interview Prep',
  'resume':          'Resume Analyser',
  'cover-letter':    'Cover Letter',
  'dashboard':       'Dashboard',
  'visa-tracker':    'Visa Tracker',
  'resume-analyser': 'Resume Analyser',
  'blog':            'Blog',
  'digest':          'Research',
  'githot':          'GitHub Hot',
  'ai-news':         'AI News',
  'visa-news':       'Visa News',
};

/* Which zone does a top-level segment belong to? */
const ZONE: Record<string, string> = {
  'jobs':           'Search',
  'au-insights':    'Search',
  'githot':         'Search',
  'digest':         'Posts',
  'blog':           'Posts',
  'ai-news':        'Posts',
  'visa-news':      'Posts',
  'dashboard':      'Track',
};

/* Pages that don't need breadcrumbs */
const SKIP_PREFIXES = ['/', '/login', '/pricing', '/about', '/blog', '/githot', '/digest', '/jobs', '/au-insights', '/resume', '/cover-letter', '/interview-prep', '/learn$', '/visa-news$', '/ai-news$', '/posts'];

export default function Breadcrumb() {
  const pathname = usePathname();

  // Only show on nested pages (depth ≥ 2 segments)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const crumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }];

  // Add zone label as non-linked context
  const zone = ZONE[segments[0]];

  let cumulativePath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    cumulativePath += '/' + seg;
    const label = LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    crumbs.push({ label, href: cumulativePath });
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
        {zone && (
          <>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <Separator />
              <span style={{ fontWeight: 500, color: 'var(--text-muted)', opacity: 0.7 }}>{zone}</span>
            </li>
            {crumbs.slice(1).map((crumb, i) => {
              const isLast = i === crumbs.length - 2;
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
          </>
        )}
      </ol>
    </nav>
  );
}

function Separator() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
      <path d="M3.5 2L6.5 5L3.5 8" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
