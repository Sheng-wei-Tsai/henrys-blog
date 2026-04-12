import { Metadata } from 'next';
import InterviewPrepClient from './InterviewPrepClient';

export const metadata: Metadata = {
  title: 'Interview Prep — Australian IT Job Tools',
  description: 'AI interview prep, resume analyser, cover letter generator, and networking hub for international IT graduates in Australia.',
};

export default function InterviewPage() {
  return <InterviewPrepClient />;
}
