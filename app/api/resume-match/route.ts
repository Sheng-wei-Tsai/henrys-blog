import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { resume } from '@/lib/resume-data';

export const dynamic = 'force-dynamic';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const resumeText = `
Name: ${resume.name}
Title: ${resume.title}
Summary: ${resume.summary}
Skills: ${Object.values(resume.skills).flat().join(', ')}
Projects: ${resume.projects.map(p => `${p.name}: ${p.description} (${p.tech.join(', ')})`).join(' | ')}
Education: ${resume.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
`.trim();

export async function POST(req: NextRequest) {
  const { jobDescription } = await req.json();
  if (!jobDescription) return new Response(JSON.stringify({ error: 'Missing job description' }), { status: 400 });

  const prompt = `You are an ATS (Applicant Tracking System) expert and Australian recruitment specialist.

Analyse how well this resume matches the job description. Be specific and practical.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Return a JSON object with exactly this structure:
{
  "score": <number 0-100>,
  "summary": "<2 sentence assessment>",
  "matched": ["<keyword or skill found in both>", ...],
  "missing": ["<important keyword/skill from JD not in resume>", ...],
  "suggestions": ["<specific actionable tip to improve match>", ...]
}

Rules:
- matched: list actual keywords/skills/tools that appear in both
- missing: list important technical terms, tools, or soft skills from the JD that are absent
- suggestions: 3-4 specific, actionable tips (e.g. "Add 'agile' to your summary", "Mention Docker in project 2")
- score: be honest — 60-80 is good for a grad role, 80+ is excellent
- Return valid JSON only`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const raw = response.choices[0].message.content ?? '{}';
  try {
    return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Parse error' }), { status: 500 });
  }
}
