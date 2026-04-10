import { getAllAINews } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI News — TechPath AU',
  description: 'Daily AI news from Anthropic, OpenAI, and Google — enriched with developer context.',
};

export default function PostsAINewsPage() {
  const ainews = getAllAINews();
  return <BlogList posts={ainews} tags={[]} />;
}
