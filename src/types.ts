// Shared types for ai-changelog.

export interface GitCommit {
  /** Full commit hash. */
  hash: string;
  /** Short hash (7 chars). */
  shortHash: string;
  /** Subject line. */
  subject: string;
  /** Full message body (subject + body). */
  message: string;
  /** Author name. */
  author: string;
  /** Author email. */
  email: string;
  /** ISO date of the commit. */
  date: string;
  /** Parsed conventional commit info, when present. */
  conventional?: ConventionalCommit;
}

export interface ConventionalCommit {
  type: string;
  scope?: string;
  breaking: boolean;
  description: string;
}

export interface ChangelogEntry {
  commit: GitCommit;
  /** Group the commit belongs to: added | changed | fixed | removed | breaking | other. */
  group: string;
  /** Human-readable bullet text. */
  text: string;
}

export interface GeneratedChangelog {
  /** Title, e.g. "## [1.2.0] - 2026-08-15". */
  title: string;
  /** Suggested semver bump. */
  bump: 'major' | 'minor' | 'patch' | 'none';
  /** Suggested next version. */
  nextVersion: string;
  /** Groups with their entries. */
  groups: { name: string; entries: string[] }[];
  /** Raw markdown. */
  markdown: string;
  /** Whether the result came from an LLM (true) or the rule engine (false). */
  usedLlm: boolean;
}

export type Language = 'zh' | 'en';
export type Provider = 'openai' | 'deepseek' | 'anthropic' | 'ollama' | 'auto';

export interface LlmResult {
  ok: boolean;
  markdown?: string;
  error?: string;
}

export interface RangeResult {
  commits: GitCommit[];
  /** Previous tag used as the base, if any. */
  fromTag?: string;
  /** Full range string like "v1.0.0..HEAD". */
  range: string;
}
