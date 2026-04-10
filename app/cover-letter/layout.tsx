import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator — TechPath AU',
  description: 'Generate a tailored, ATS-optimised cover letter for any Australian IT role in seconds. Customised to your background and the job description.',
};

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
