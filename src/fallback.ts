import type { GeneratedChangelog, GitCommit, Language } from './types.js';
import { groupCommits } from './commits.js';
import { bumpVersion, suggestBump } from './semver.js';

const GROUP_LABELS: Record<string, Record<Language, string>> = {
  breaking: { zh: '💥 破坏性变更', en: '💥 Breaking Changes' },
  added: { zh: '✨ 新增', en: '✨ Added' },
  changed: { zh: '🔧 变更', en: '🔧 Changed' },
  fixed: { zh: '🐛 修复', en: '🐛 Fixed' },
  removed: { zh: '🗑️ 移除', en: '🗑️ Removed' },
  other: { zh: '📝 其他', en: '📝 Other' },
};

/**
 * Generate a changelog with a deterministic rule engine.
 * Used when no LLM is configured or the LLM call fails.
 */
export function generateFallback(
  commits: GitCommit[],
  opts: {
    language: Language;
    nextVersion: string;
    date: string;
  }
): GeneratedChangelog {
  const groups = groupCommits(commits);
  const bump = suggestBump(commits);
  const version = opts.nextVersion || bumpVersion(undefined, bump);
  const title = `## [${version}] - ${opts.date}`;
  const mdGroups = groups
    .map((g) => {
      const label = GROUP_LABELS[g.group]?.[opts.language] ?? g.group;
      const bullets = g.commits.map((c) => `- ${c.text}`).join('\n');
      return `${label}\n${bullets}`;
    })
    .join('\n\n');
  const markdown = mdGroups ? `${title}\n\n${mdGroups}\n` : `${title}\n`;
  return {
    title,
    bump,
    nextVersion: version,
    groups: groups.map((g) => ({
      name: GROUP_LABELS[g.group]?.[opts.language] ?? g.group,
      entries: g.commits.map((c) => c.text),
    })),
    markdown,
    usedLlm: false,
  };
}
