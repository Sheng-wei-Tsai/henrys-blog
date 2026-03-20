import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const APP_ID  = process.env.ADZUNA_APP_ID!;
const APP_KEY = process.env.ADZUNA_APP_KEY!;

export interface AdzunaJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  created: string;
  category: string;
  contract_type: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const keywords  = searchParams.get('keywords') || 'software developer';
  const location  = searchParams.get('location') || 'Brisbane';
  const page      = searchParams.get('page') || '1';
  const fullTime  = searchParams.get('full_time');
  const sortBy    = searchParams.get('sort_by') || 'date';

  const params = new URLSearchParams({
    app_id:           APP_ID,
    app_key:          APP_KEY,
    results_per_page: '20',
    what:             keywords,
    where:            location,
    sort_by:          sortBy,
  });

  if (fullTime === '1') params.set('full_time', '1');

  const url = `https://api.adzuna.com/v1/api/jobs/au/search/${page}?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();

    const jobs: AdzunaJob[] = (data.results ?? []).map((r: any) => ({
      id:            r.id,
      title:         r.title,
      company:       r.company?.display_name ?? 'Unknown',
      location:      r.location?.display_name ?? location,
      description:   r.description,
      salary:        r.salary_min
        ? `$${Math.round(r.salary_min / 1000)}k – $${Math.round(r.salary_max / 1000)}k`
        : null,
      url:           r.redirect_url,
      created:       r.created,
      category:      r.category?.label ?? '',
      contract_type: r.contract_type ?? null,
    }));

    return NextResponse.json({ jobs, total: data.count ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
