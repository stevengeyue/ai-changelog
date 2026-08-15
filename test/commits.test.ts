import { describe, it, expect } from 'vitest';
import { bulletText, commitsToPrompt, detectLanguage, groupCommits, groupOf, isBreaking, parseConventional } from '../src/commits.js';
import type { GitCommit } from '../src/types.js';

function commit(subject: string, extra: Partial<GitCommit> = {}): GitCommit {
  return {
    hash: 'a'.repeat(40),
    shortHash: 'aaaaaaa',
    subject,
    message: subject,
    conventional: parseConventional(subject),
    author: 'Test',
    email: 'test@example.com',
    date: '2026-08-15T00:00:00Z',
    ...extra,
  };
}

describe('conventional commit parsing', () => {
  it('parses feat with scope', () => {
    const c = commit('feat(auth): add refresh tokens');
    expect(c.conventional?.type).toBe('feat');
    expect(c.conventional?.scope).toBe('auth');
    expect(c.conventional?.breaking).toBe(false);
  });

  it('detects breaking bang', () => {
    const c = commit('feat!: drop Node 16 support');
    expect(isBreaking(c)).toBe(true);
  });

  it('detects BREAKING CHANGE footer', () => {
    const c = commit('fix: whatever', { message: 'fix: whatever\n\nBREAKING CHANGE: config keys renamed' });
    expect(isBreaking(c)).toBe(true);
  });

  it('treats plain messages as non-breaking', () => {
    const c = commit('update the readme');
    expect(isBreaking(c)).toBe(false);
  });
});

describe('grouping', () => {
  it('maps conventional types to Keep a Changelog groups', () => {
    expect(groupOf(commit('feat: x'))).toBe('added');
    expect(groupOf(commit('fix: x'))).toBe('fixed');
    expect(groupOf(commit('perf: x'))).toBe('changed');
    expect(groupOf(commit('chore: x'))).toBe('other');
    expect(groupOf(commit('docs: x'))).toBe('other');
    expect(groupOf(commit('whatever'))).toBe('other');
  });

  it('groups commits in canonical order with breaking first', () => {
    const groups = groupCommits([
      commit('fix: typo'),
      commit('feat!: new API'),
      commit('feat: shiny'),
    ]);
    expect(groups.map((g) => g.group)).toEqual(['breaking', 'added', 'fixed']);
  });

  it('builds readable bullets with scope', () => {
    expect(bulletText(commit('feat(auth): add refresh tokens'))).toBe('**auth:** add refresh tokens');
  });
});

describe('commitsToPrompt', () => {
  it('formats commits with markers', () => {
    const out = commitsToPrompt([
      commit('feat!: drop node 16'),
      commit('fix: crash on empty file'),
    ]);
    expect(out).toContain('[BREAKING]');
    expect(out).toContain('fix: crash on empty file');
  });
});

describe('detectLanguage', () => {
  it('detects Chinese commits', () => {
    const c = commit('修复登录时的崩溃问题');
    expect(detectLanguage([c])).toBe('zh');
  });
  it('detects English commits', () => {
    const c = commit('fix login crash');
    expect(detectLanguage([c])).toBe('en');
  });
  it('returns en for mixed but mostly English', () => {
    const en = commit('add dark mode');
    const zh = commit('优化一下性能');
    expect(detectLanguage([en, en, zh])).toBe('en');
  });
});
