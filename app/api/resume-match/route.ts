import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { resume } from '@/lib/resume-data';
import { requireSubscription, recordUsage, checkEndpointRateLimit } from '@/lib/subscription';
import { rateLimitResponse } from '@/lib/auth-server';

const resumeText = `
Name: ${resume.name}
Title: ${resume.title}
Summary: ${resume.summary}
Skills: ${Object.values(resume.skills).flat().join(', ')}
Projects: ${resume.projects.map(p => `${p.name}: ${p.description} (${p.tech.join(', ')})`).join(' | ')}
Education: ${resume.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
`.trim();

export async function POST(req: NextRequest) {
  const auth = await requireSubscription();
  if (auth instanceof NextResponse) return auth;

  // Per-endpoint daily limit (30 calls — expensive route at ~$0.020/call)
  if (!(await checkEndpointRateLimit(auth.user.id, 'resume-match'))) return rateLimitResponse();

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API not configured' }), { status: 503 });
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let body: { jobDescription?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { jobDescription } = body;
  if (!jobDescription) {
    return new Response(JSON.stringify({ error: 'Missing job description' }), { status: 400 });
  }

  const prompt = `You are an ATS expert and Australian IT recruitment specialist with 15+ years placing engineers at Atlassian, CBA, Accenture, and AWS.

Analyse how well this resume matches the job description for the Australian IT market. Be specific — name actual terms from both documents.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Return a JSON object with exactly this structure:
{
  "score": <number 0-100>,
  "summary": "<2 sentence honest assessment — mention the strongest match AND the biggest gap>",
  "matched": ["<exact keyword, skill, or tool found in both documents>", ...],
  "missing": ["<important keyword/skill/tool from JD that is absent or weak in resume>", ...],
  "suggestions": ["<specific, actionable tip — quote the JD term and where to add it in the resume>", ...]
}

Scoring guide (AU grad market):
- 80–100: Strong match — likely to pass ATS and recruiter screen
- 60–79: Good foundation — 2–3 targeted additions would get through
- 40–59: Partial match — needs meaningful additions or rephrasing
- below 40: Significant gap — consider whether this role is the right target

Rules:
- matched: only list terms that genuinely appear in both — no hallucination
- missing: prioritise technical tools/skills the JD lists as required, not just preferred
- suggestions: 3–5 tips, each referencing a specific JD requirement and a specific resume section to update (e.g. "Add 'CI/CD pipelines' to the XYZ project bullet — JD requires it in 3 places")
- Use AU English: organised, recognised, behaviour
- Return valid JSON only — no markdown, no prose outside the JSON`;

  const response = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  void recordUsage(auth.user.id, 'resume-match');
  const raw = response.choices[0].message.content ?? '{}';
  return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
}
