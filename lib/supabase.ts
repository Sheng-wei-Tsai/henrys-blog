import { createBrowserClient } from '@supabase/ssr';

// Fallback to placeholder during static build — real values are baked in at deploy time
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Use this in client components ('use client')
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ── Types matching our schema ──────────────────────────────────

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  url: string;
  description: string | null;
  category: string | null;
  contract_type: string | null;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  title: string;
  company: string;
  url: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  applied_at: string;
  notes: string | null;
  updated_at: string;
}
