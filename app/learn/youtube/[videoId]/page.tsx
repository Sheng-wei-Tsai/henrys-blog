import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import StudySession from './StudySession';

type Props = { params: Promise<{ videoId: string }> };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://henrysdigitallife.com';

// ── SEO metadata — uses Supabase cache so popular videos get real titles ──────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await sb
    .from('video_content')
    .select('video_title, channel_title')
    .eq('video_id', videoId)
    .maybeSingle();

  const title       = data?.video_title ?? 'YouTube Study Guide';
  const channel     = data?.channel_title ? ` · ${data.channel_title}` : '';
  const pageTitle   = `${title} — Study Guide | TechPath AU`;
  const description = `AI study guide for "${title}"${channel}. Key concepts, flashcards, quiz, and audio summary for Australian IT professionals.`;
  const url         = `${BASE_URL}/learn/youtube/${videoId}`;

  return {
    title:       pageTitle,
    description,
    openGraph:   { title: pageTitle, description, type: 'website', url },
    twitter:     { card: 'summary_large_image', title: pageTitle, description },
    alternates:  { canonical: url },
  };
}

// ── Server entry — pre-loads cached guide so the page renders instantly ────────
export default async function VideoStudyPage({ params }: Props) {
  const { videoId } = await params;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Check global video cache — if the guide already exists, pass it as props so
  // the client component skips the streaming analysis entirely and renders immediately.
  const { data } = await sb
    .from('video_content')
    .select('video_title, channel_title, study_guide, quiz_questions')
    .eq('video_id', videoId)
    .maybeSingle();

  const hasGuide = data?.study_guide && (data.study_guide.essay || data.study_guide.summary);

  const initialMeta = hasGuide ? {
    id:           videoId,
    title:        data!.video_title ?? '',
    channelTitle: data!.channel_title ?? '',
    // Standard YouTube thumbnail URL — no RapidAPI needed for cached videos
    thumbnail:    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    duration:     '',
  } : null;

  const initialGuide = hasGuide ? data!.study_guide : null;
  const initialQuiz  = data?.quiz_questions?.length ? data.quiz_questions : null;

  return (
    <StudySession
      serverVideoId={videoId}
      initialMeta={initialMeta}
      initialGuide={initialGuide}
      initialQuiz={initialQuiz}
    />
  );
}
