import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';
import Analytics from '@/components/Analytics';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://henrysdigitallife.com'),
  title: { default: 'Henry Tsai — Full Stack Developer', template: '%s · Henry Tsai' },
  description: 'Henry Tsai — Full stack developer in Brisbane. Job search tools, AI interview prep, cover letter generator, and writing about web development and AI.',
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'Henry Tsai — RSS Feed' },
      ],
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Analytics />
          <Header />
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
