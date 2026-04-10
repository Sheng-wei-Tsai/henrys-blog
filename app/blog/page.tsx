import { redirect } from 'next/navigation';

// Legacy redirect — /blog now lives at /posts/blog
export default function BlogRedirect() {
  redirect('/posts/blog');
}
