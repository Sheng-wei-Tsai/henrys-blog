/**
 * Claude Code CLI shim for content automation scripts.
 *
 * Bills against the Claude Code Pro subscription via CLAUDE_CODE_OAUTH_TOKEN
 * instead of the pay-as-you-go ANTHROPIC_API_KEY. This is the migration target
 * for scripts that previously used `@anthropic-ai/sdk` directly.
 *
 * Requires the `claude` CLI on PATH (`npm i -g @anthropic-ai/claude-code` in CI).
 *
 * Usage:
 *   const text = await claudeMessage({
 *     model: 'claude-haiku-4-5-20251001',
 *     system: 'You are ...',
 *     prompt: 'Summarise this ...',
 *   });
 */
import { spawn } from 'child_process';

export type ClaudeModel =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-7'
  | string;

export interface ClaudeMessageOpts {
  prompt: string;
  system?: string;
  model?: ClaudeModel;
  /** Retry on transient failures (overload / quota). Default 2. */
  retries?: number;
  /** Per-attempt timeout in ms. Default 120_000 (2m). */
  timeoutMs?: number;
}

const QUOTA_PATTERN =
  /hit your limit|credit balance is too low|quota.*exceeded|rate limit|5-hour limit|usage limit reached|claude ai usage limit|try again.{0,30}(hour|later)/i;

const TRANSIENT_PATTERN =
  /overloaded|529|500 internal|502 bad gateway|timeout|ETIMEDOUT|ECONNRESET/i;

export class ClaudeQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeQuotaError';
  }
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function runOnce(opts: ClaudeMessageOpts): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', opts.prompt,
      '--model', opts.model ?? 'claude-haiku-4-5-20251001',
      '--output-format', 'text',
    ];
    if (opts.system) {
      args.push('--append-system-prompt', opts.system);
    }

    const proc = spawn('claude', args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, opts.timeoutMs ?? 120_000);

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', code => {
      clearTimeout(timer);
      if (killed) {
        reject(new Error(`claude CLI timed out after ${opts.timeoutMs ?? 120_000}ms`));
        return;
      }
      const combined = `${stdout}\n${stderr}`;
      if (QUOTA_PATTERN.test(combined)) {
        reject(new ClaudeQuotaError(`Claude quota hit: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`claude CLI exit ${code}: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export async function claudeMessage(opts: ClaudeMessageOpts): Promise<string> {
  const retries = opts.retries ?? 2;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await runOnce(opts);
    } catch (err) {
      lastErr = err;
      if (err instanceof ClaudeQuotaError) {
        // Try GitHub Models (Copilot Pro+) as a fallback before giving up.
        const fallback = await tryGithubModelsFallback(opts, err);
        if (fallback !== null) return fallback;
        throw err;
      }
      const msg = (err as Error).message ?? '';
      if (!TRANSIENT_PATTERN.test(msg) || attempt === retries) throw err;
      const wait = (attempt + 1) * 6000;
      console.warn(`  WARNING: claude CLI transient error, retrying in ${wait / 1000}s — ${msg.slice(0, 120)}`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function tryGithubModelsFallback(
  opts: ClaudeMessageOpts,
  quotaErr: ClaudeQuotaError,
): Promise<string | null> {
  // Lazy-import so callers without GH_MODELS_TOKEN never load the module.
  const { hasGithubModelsToken, githubModelsMessage, GithubModelsQuotaError } =
    await import('./llm-github');

  if (!hasGithubModelsToken()) return null;

  console.warn(
    `  WARNING: Claude quota hit (${quotaErr.message.slice(0, 100)}) — falling back to GitHub Models (Copilot Pro+).`,
  );
  try {
    const result = await githubModelsMessage(opts);
    console.warn(`  ✓ GitHub Models fallback succeeded`);
    return result;
  } catch (fallbackErr) {
    if (fallbackErr instanceof GithubModelsQuotaError) {
      console.warn(`  WARNING: GitHub Models quota also exhausted — giving up`);
    } else {
      console.warn(`  WARNING: GitHub Models fallback failed — ${(fallbackErr as Error).message?.slice(0, 200)}`);
    }
    return null;
  }
}

/**
 * Convenience helper for prompts that expect a JSON object response.
 * Strips any prose around the first balanced `{...}` block.
 */
export async function claudeJSON<T>(opts: ClaudeMessageOpts & { fallback: T }): Promise<T> {
  const raw = await claudeMessage(opts);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return opts.fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return opts.fallback;
  }
}
