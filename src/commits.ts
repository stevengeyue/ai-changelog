import type { ConventionalCommit, GitCommit, Language } from './types.js';

export interface GroupedCommit {
  group: string;
  text: string;
}

// Conventional Commit types -> changelog group.
const TYPE_TO_GROUP: Record<string, string> = {
  feat: 'added',
  feature: 'added',
  fix: 'fixed',
  bugfix: 'fixed',
  perf: 'changed',
  refactor: 'changed',
  style: 'changed',
  docs: 'other',
  chore: 'other',
  build: 'other',
  ci: 'other',
  test: 'other',
  deps: 'changed',
  revert: 'removed',
  remove: 'removed',
  breaking: 'breaking',
};

/** True when the commit message marks a breaking change. */
export function isBreaking(commit: GitCommit): boolean {
  if (commit.conventional?.breaking) return true;
  return /BREAKING CHANGE|breaking change/i.test(commit.message);
}

/**
 * Build a human-readable bullet for a commit.
 * Prefers the conventional description; strips type prefixes otherwise.
 */
export function bulletText(commit: GitCommit): string {
  if (commit.conventional) {
    const scope = commit.conventional.scope ? `**${commit.conventional.scope}:** ` : '';
    return `${scope}${commit.conventional.description}`;
  }
  const subject = commit.subject.trim();
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

/** Assign a changelog group to a commit. */
export function groupOf(commit: GitCommit): string {
  if (isBreaking(commit)) return 'breaking';
  const type = commit.conventional?.type;
  return (type && TYPE_TO_GROUP[type]) || 'other';
}

/** Group a list of commits into ordered buckets. */
export function groupCommits(
  commits: GitCommit[]
): { group: string; commits: GroupedCommit[] }[] {
  const order = ['breaking', 'added', 'changed', 'fixed', 'removed', 'other'];
  const buckets = new Map<string, GroupedCommit[]>();
  for (const commit of commits) {
    const group = groupOf(commit);
    if (!buckets.has(group)) buckets.set(group, []);
    buckets.get(group)!.push({ group, text: bulletText(commit) });
  }
  return order
    .filter((g) => buckets.has(g))
    .map((g) => ({ group: g, commits: buckets.get(g)! }));
}

/**
 * A short comma-separated list of commit subjects for the LLM prompt.
 * Truncated to stay within token budgets.
 */
export function commitsToPrompt(commits: GitCommit[], max = 120): string {
  const lines = commits.map((c, i) => {
    const scope = c.conventional?.scope ? `(${c.conventional.scope})` : '';
    const type = c.conventional ? `${c.conventional.type}${scope}: ` : '';
    const breaking = isBreaking(c) ? ' [BREAKING]' : '';
    return `${i + 1}. ${type}${c.subject}${breaking}`;
  });
  return lines.slice(0, max).join('\n');
}

const CONVENTIONAL_RE =
  /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<desc>.+)$/;

/** Parse a conventional commit subject, or undefined when it does not match. */
export function parseConventional(subject: string): ConventionalCommit | undefined {
  const m = CONVENTIONAL_RE.exec(subject.trim());
  if (!m) return undefined;
  const groups = m.groups!;
  return {
    type: groups.type!.toLowerCase(),
    scope: groups.scope,
    breaking: !!groups.bang,
    description: groups.desc!.trim(),
  };
}

/** Count CJK characters in a string. */
function countCjk(s: string): number {
  const m = s.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g);
  return m ? m.length : 0;
}

/**
 * Heuristically detect the dominant language of a set of commits.
 * A commit counts as Chinese when a meaningful share of its text is CJK.
 * Returns 'zh' when the majority of commits are Chinese.
 */
export function detectLanguage(commits: GitCommit[], threshold = 0.5): Language {
  let zhCommits = 0;
  for (const c of commits) {
    const len = c.message.length;
    if (len > 0 && countCjk(c.message) / len > 0.3) zhCommits++;
  }
  return commits.length > 0 && zhCommits / commits.length > threshold ? 'zh' : 'en';
}
