import { execFileSync } from 'node:child_process';
import type { GitCommit, RangeResult } from './types.js';
import { parseConventional } from './commits.js';

const MAX_BUFFER = 16 * 1024 * 1024;

/** Run a git command inside the repo and return trimmed stdout. */
function gitOut(repo: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf-8',
    maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** Latest tag reachable from HEAD, or undefined. */
export function latestTag(repo: string): string | undefined {
  try {
    const tag = gitOut(repo, ['describe', '--tags', '--abbrev=0', 'HEAD']);
    return tag || undefined;
  } catch {
    return undefined;
  }
}

/** All tags sorted by commit date descending. */
export function listTags(repo: string): string[] {
  try {
    const out = gitOut(repo, ['tag', '--sort=-creatordate']);
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** True when the working tree has uncommitted changes. */
export function hasUncommittedChanges(repo: string): boolean {
  try {
    const out = gitOut(repo, ['status', '--porcelain']);
    return out.length > 0;
  } catch {
    return false;
  }
}


/** Parse one line of the custom git log format. */
function parseLogLine(line: string): GitCommit {
  // Format: HASH\tAUTHOR\tEMAIL\tISO_DATE\tSUBJECT
  const [hash, author, email, date, ...rest] = line.split('\t');
  const subject = rest.join('\t') || '(no message)';
  return {
    hash,
    shortHash: hash.slice(0, 7),
    author,
    email,
    date,
    subject,
    message: subject,
    conventional: parseConventional(subject),
  };
}

/**
 * Collect commits in the range `from..to`. When `from` is undefined, walks
 * back to the first commit of the repo.
 */
export function collectCommits(
  repo: string,
  from: string | undefined,
  to: string
): { commits: GitCommit[]; range: string } {
  const range = from ? `${from}..${to}` : to;
  const args = [
    'log',
    '--no-merges',
    '--format=%H%x09%an%x09%ae%x09%aI%x09%s',
    range,
  ];
  let out: string;
  try {
    out = gitOut(repo, args);
  } catch {
    // Range may be invalid (e.g. no commits yet). Try the whole history.
    out = gitOut(repo, ['log', '--no-merges', '--format=%H%x09%an%x09%ae%x09%aI%x09%s', to]);
  }
  const commits = out
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => parseLogLine(line));
  return { commits, range };
}

/** Resolve the git range for the CLI: latest tag..HEAD by default. */
export function resolveRange(repo: string, from?: string, to = 'HEAD'): RangeResult {
  const tag = from ?? latestTag(repo);
  const { commits, range } = collectCommits(repo, tag, to);
  return { commits, fromTag: tag, range };
}

/** Human-readable repo name from the remote or directory name. */
export function repoName(repo: string): string {
  try {
    const url = gitOut(repo, ['config', '--get', 'remote.origin.url']);
    if (url) {
      const m =
        /(?:[\w-]+\.git|github\.com[:/])([\w.-]+)\.git$/.exec(url) ||
        /([\w.-]+)\.git$/.exec(url);
      if (m) return m[1];
    }
  } catch {
    /* fall through */
  }
  return repo.split(/[\\/]/).filter(Boolean).pop() || 'repo';
}
