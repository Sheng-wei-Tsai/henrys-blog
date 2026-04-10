import type { Metadata } from 'next';
import { Space_Grotesk, Lora, Caveat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';
import Analytics from '@/components/Analytics';
import { Toaster } from 'sonner';

// ── Fonts loaded via next/font — zero render-blocking, auto-subsetted ──────────
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-caveat',
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://henrysdigitallife.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'TechPath AU — Career tools for international IT grads', template: '%s · TechPath AU' },
  description: 'Resume analyser, AI interview prep, visa tracker, salary checker, and learning paths — built for international IT graduates in Australia.',
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'TechPath AU — RSS Feed' },
      ],
    },
  },
  openGraph: {
    title: 'TechPath AU — Career tools for international IT grads in Australia',
    description: 'Resume analyser, AI interview prep, visa tracker, salary checker, and learning paths — built for international IT graduates in Australia.',
    type: 'website',
    url: BASE_URL,
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'TechPath AU' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechPath AU — Career tools for international IT grads in Australia',
    description: 'Resume analyser, AI interview prep, visa tracker, salary checker, and learning paths.',
    images: ['/opengraph-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${lora.variable} ${caveat.variable}`}
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <Analytics />
          <Header />
          <Breadcrumb />
          <main style={{ minHeight: '70vh' }}>
            {children}
          </main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'inherit',
                fontSize: '0.88rem',
                borderRadius: '10px',
                border: '1px solid var(--parchment)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
