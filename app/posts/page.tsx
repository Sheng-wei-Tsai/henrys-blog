import { getAllPosts, getAllDigests, getAllGithot, getAllAINews, getAllVisaNews, getAllTags } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Posts — TechPath AU',
  description: 'Blog posts, AI research digest, GitHub trending, and daily AI company news — all in one place.',
};

export default function PostsPage() {
  const posts    = getAllPosts();
  const digests  = getAllDigests();
  const githot   = getAllGithot();
  const ainews   = getAllAINews();
  const visanews = getAllVisaNews();
  const tags     = getAllTags();

  const all = [...posts, ...digests, ...githot, ...ainews, ...visanews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return <BlogList posts={all} tags={tags} />;
}
