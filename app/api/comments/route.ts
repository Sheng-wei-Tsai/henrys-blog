import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function serverSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

const SLUG_RE = /^[a-z0-9-]+$/;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const sb = await serverSupabase();
  const { data, error } = await sb
    .from('post_comments')
    .select(`
      id, post_slug, content, parent_id, edited_at, created_at,
      profiles ( full_name, avatar_url )
    `)
    .eq('post_slug', slug)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(req: NextRequest) {
  const sb = await serverSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const slug      = String(body.post_slug ?? '').trim();
  const content   = String(body.content   ?? '').trim();
  const parent_id = body.parent_id ?? null;

  if (!SLUG_RE.test(slug))            return NextResponse.json({ error: 'Invalid slug' },    { status: 400 });
  if (!content || content.length > 2000) return NextResponse.json({ error: 'Invalid content' }, { status: 400 });

  const { data, error } = await sb
    .from('post_comments')
    .insert({ post_slug: slug, user_id: user.id, content, parent_id })
    .select(`id, post_slug, content, parent_id, edited_at, created_at, profiles ( full_name, avatar_url )`)
    .single();

  if (error) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
