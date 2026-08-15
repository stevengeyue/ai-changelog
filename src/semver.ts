import type { GitCommit } from './types.js';
import { isBreaking } from './commits.js';

export type Bump = 'major' | 'minor' | 'patch' | 'none';

/** Suggest a semver bump based on conventional commit types. */
export function suggestBump(commits: GitCommit[]): Bump {
  if (commits.some(isBreaking)) return 'major';
  if (commits.some((c) => c.conventional?.type === 'feat')) return 'minor';
  if (commits.some((c) => c.conventional && c.conventional.type !== 'docs' && c.conventional.type !== 'chore'))
    return 'patch';
  return commits.length > 0 ? 'patch' : 'none';
}

/**
 * Bump a semantic version string. Falls back to 0.1.0 when unparseable.
 */
export function bumpVersion(current: string | undefined, bump: Bump): string {
  const parts = (current || '0.0.0').replace(/^v/, '').split('.').map(Number);
  const [major, minor, patch] = [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return `${major}.${minor}.${patch}`;
  }
}

/** Extract a semver-looking version from a tag like "v1.2.3" or "release-2.0". */
export function versionFromTag(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  const m = /(\d+\.\d+\.\d+)/.exec(tag);
  return m ? m[1] : undefined;
}
