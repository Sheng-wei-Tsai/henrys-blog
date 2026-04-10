import { getAllDigests } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Digest — TechPath AU',
  description: 'Daily AI research digest — the most important papers and announcements, summarised.',
};

export default function PostsResearchPage() {
  const digests = getAllDigests();
  return <BlogList posts={digests} tags={[]} />;
}
