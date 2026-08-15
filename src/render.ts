import pc from 'picocolors';
import type { GeneratedChangelog } from './types.js';

/** Colorize one group name for terminal output. */
function groupColor(name: string): string {
  if (name.includes('Breaking')) return pc.bold(pc.red(name));
  if (name.includes('Added') || name.includes('新增')) return pc.bold(pc.green(name));
  if (name.includes('Fixed') || name.includes('修复')) return pc.bold(pc.yellow(name));
  if (name.includes('Removed') || name.includes('移除')) return pc.bold(pc.red(name));
  return pc.bold(pc.cyan(name));
}

/** Render the changelog to a colorized terminal string. */
export function renderTerminal(g: GeneratedChangelog): string {
  const lines: string[] = [];
  lines.push(pc.bold(pc.underline(g.title)));
  lines.push(pc.dim(`  bump: ${g.bump}${g.usedLlm ? '' : ' (rule engine)'}`));
  lines.push('');
  for (const group of g.groups) {
    lines.push(groupColor(group.name));
    for (const entry of group.entries) {
      lines.push('  - ' + entry);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Render the changelog as plain markdown. */
export function renderMarkdown(g: GeneratedChangelog): string {
  return g.markdown;
}

/** Render the changelog as JSON. */
export function renderJson(g: GeneratedChangelog): string {
  return JSON.stringify(
    {
      title: g.title,
      bump: g.bump,
      nextVersion: g.nextVersion,
      usedLlm: g.usedLlm,
      groups: g.groups,
      markdown: g.markdown,
    },
    null,
    2
  );
}
