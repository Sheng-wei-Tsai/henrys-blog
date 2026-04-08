import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireSubscription } from '@/lib/subscription';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior Australian IT recruiter and career coach with 15+ years of experience hiring for companies like Atlassian, Canva, CBA, and Accenture. You review resumes specifically for the Australian IT job market.

Analyse the provided resume PDF and return a JSON response with this exact structure:
{
  "overallScore": <number 0-100>,
  "scoreLabel": <"Excellent" | "Strong" | "Good" | "Needs Work" | "Major Revision Needed">,
  "summary": <2-3 sentence overall verdict focused on interview readiness for AU IT roles>,
  "auFormatting": {
    "score": <0-100>,
    "issues": [{ "severity": "critical"|"warning"|"pass", "title": <string>, "detail": <string> }]
  },
  "contentQuality": {
    "score": <0-100>,
    "strengths": [<string>],
    "gaps": [<string>]
  },
  "auMarketFit": {
    "score": <0-100>,
    "topRolesMatch": [<string>],
    "missingSkills": [<string>],
    "shortage": <boolean — true if candidate's skills align with JSA shortage occupations>
  },
  "actionItems": [
    { "priority": "high"|"medium"|"low", "action": <specific thing to change or add> }
  ],
  "interviewReadiness": <"Ready to apply now" | "1-2 quick fixes needed" | "Significant revision needed" | "Complete rewrite recommended">
}

Australian IT market context to apply:
- AU standard: 2 pages max for grads, 3 for senior. No photo, no DOB, no full home address.
- Use AU English spelling (analyse, colour, organisation).
- Quantified achievements (numbers, %, $) are highly valued by AU recruiters.
- GitHub/portfolio links are expected for tech roles.
- Super (superannuation) is separate from salary — candidates should know this.
- Key shortage occupations (JSA 2024): Software Engineer, DevOps/Cloud, Cyber Security, Data Engineer, ML Engineer.
- ATS keywords matter — LinkedIn/SEEK algorithms scan for tech stack terms.
- AU recruiters spend ~6 seconds on first pass — first 1/3 of resume must hook them.
- STAR format preferred for experience bullets (Situation, Task, Action, Result).

Be specific and actionable. Reference actual content from the resume in your feedback.
Return ONLY the JSON — no markdown fences, no preamble.`;

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  const formData = await req.formData();
  const file = formData.get('resume') as File | null;

  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF must be under 5 MB.' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as any,
          {
            type: 'text',
            text: 'Analyse this resume for the Australian IT job market. Return the JSON analysis as instructed.',
          },
        ],
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();

  let analysis: unknown;
  try {
    analysis = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }

  return NextResponse.json(analysis);
}
