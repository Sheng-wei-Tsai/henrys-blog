import { getAllGithot } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GitHub Hot — TechPath AU',
  description: "Daily GitHub trending repos — what the dev world is building right now.",
};

export default function PostsGithotPage() {
  const githot = getAllGithot();
  return <BlogList posts={githot} tags={[]} />;
}
