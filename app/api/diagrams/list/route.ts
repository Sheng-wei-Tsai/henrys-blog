import { NextResponse } from 'next/server';
import { getAllDiagrams } from '@/lib/diagrams';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  const diagrams = getAllDiagrams();
  return NextResponse.json(diagrams);
}
