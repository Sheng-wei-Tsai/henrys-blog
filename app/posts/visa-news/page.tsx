import { getAllVisaNews } from '@/lib/posts';
import BlogList from '@/components/BlogList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visa News — TechPath AU',
  description: 'Daily Australian immigration updates — 482, student visa, PR pathways and more.',
};

export default function PostsVisaNewsPage() {
  const visanews = getAllVisaNews();
  return <BlogList posts={visanews} tags={[]} />;
}
