import { getAllPosts, getAllTags } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — TechPath AU',
  description: 'Posts and articles about web development, AI tools, and tech careers in Australia.',
};

export default function PostsBlogPage() {
  const posts = getAllPosts();
  const tags  = getAllTags();
  return <BlogList posts={posts} tags={tags} />;
}
