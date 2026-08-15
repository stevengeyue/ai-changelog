import type { Language, LlmResult, Provider } from './types.js';

export interface LlmConfig {
  provider: Provider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language: Language;
  repoName: string;
  version: string;
  commitList: string;
  commitCount: number;
}

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
  anthropic: 'claude-3-5-haiku-latest',
  ollama: 'qwen2.5:7b',
};

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  ollama: 'http://localhost:11434/v1',
};

/** Pick the provider based on available environment keys. */
export function detectProvider(): Provider {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OLLAMA_HOST || process.env.OLLAMA_MODEL) return 'ollama';
  return 'auto';
}

function buildSystemPrompt(language: Language, repoName: string, version: string): string {
  const langRule =
    language === 'zh'
      ? 'Write ALL section headings and bullet content in Simplified Chinese (中文). Keep technical terms (function names, package names) in their original form. Use a natural, concise tone — not a literal translation.'
      : 'Write in clear, concise English. Use proper grammar and keep bullets short.';
  return [
    'You are an expert release notes writer for the project ' + repoName + '.',
    'Convert the raw git commit list into a polished changelog for version ' + version + '.',
    'Follow the Keep a Changelog structure. Use ONLY these section headings (in order):',
    '- Added (new features)',
    '- Changed (changes in existing functionality)',
    '- Fixed (bug fixes)',
    '- Removed (removed features)',
    '- Other (docs, chores, tests, dependencies)',
    '- Breaking Changes (put this FIRST when the list marks [BREAKING] commits, and explain the migration impact)',
    'Rules:',
    '- Every commit must appear exactly once; do not invent commits.',
    '- Combine related commits into one clear bullet where it improves readability.',
    '- Focus on user-visible impact, not internal implementation details.',
    '- Do NOT wrap the output in markdown code fences. Output the changelog section only (start with the first section heading).',
    ' ' + langRule,
  ].join('\n');
}

function buildUserPrompt(commitList: string, commitCount: number): string {
  return [
    'The following are ' + commitCount + ' commits (newest first). Generate the changelog now.',
    '',
    commitList,
  ].join('\n');
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
}

async function chatCompletion(
  cfg: LlmConfig,
  messages: { role: string; content: string }[]
): Promise<LlmResult> {
  const baseUrl = cfg.baseUrl || DEFAULT_BASE_URLS[cfg.provider] || DEFAULT_BASE_URLS.openai;
  const model = cfg.model || DEFAULT_MODELS[cfg.provider] || DEFAULT_MODELS.openai;
  const apiKey = cfg.apiKey || process.env[`${cfg.provider.toUpperCase()}_API_KEY`];
  if (!apiKey && cfg.provider !== 'ollama') {
    return { ok: false, error: `No API key for provider '${cfg.provider}'. Set ${cfg.provider.toUpperCase()}_API_KEY or use --api-key.` };
  }
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  try {
    const res = await postJson(`${baseUrl.replace(/\/$/, '')}/chat/completions`, headers, {
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as any;
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: 'Empty LLM response' };
    return { ok: true, markdown: content.trim() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function anthropicCompletion(
  cfg: LlmConfig,
  system: string,
  user: string
): Promise<LlmResult> {
  const apiKey = cfg.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: 'No ANTHROPIC_API_KEY set.' };
  const model = cfg.model || DEFAULT_MODELS.anthropic;
  try {
    const res = await postJson(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      { model, max_tokens: 2048, system, messages: [{ role: 'user', content: user }] }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as any;
    const content: string | undefined = data?.content?.[0]?.text;
    if (!content) return { ok: false, error: 'Empty LLM response' };
    return { ok: true, markdown: content.trim() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Generate a changelog section from commits via the configured LLM. */
export async function generateWithLlm(cfg: LlmConfig): Promise<LlmResult> {
  const system = buildSystemPrompt(cfg.language, cfg.repoName, cfg.version);
  const user = buildUserPrompt(cfg.commitList, cfg.commitCount);
  if (cfg.provider === 'anthropic') {
    return anthropicCompletion(cfg, system, user);
  }
  return chatCompletion(cfg, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
}
