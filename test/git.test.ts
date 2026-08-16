import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveRange, latestTag, tagBefore } from '../src/git.js';

function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'aichg-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 't@t'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 't'], { cwd: dir });
  return dir;
}

function commit(dir: string, msg: string): void {
  execFileSync('git', ['commit', '--allow-empty', '-m', msg], { cwd: dir });
}

function tag(dir: string, name: string): void {
  execFileSync('git', ['tag', name], { cwd: dir });
}

describe('git range resolution', () => {
  it('uses the nearest tag before an explicit --to', () => {
    const dir = makeRepo();
    try {
      commit(dir, 'feat: first');
      tag(dir, 'v1.0.0');
      commit(dir, 'feat: second');
      commit(dir, 'fix: third');
      tag(dir, 'v1.1.0');
      commit(dir, 'feat: fourth');

      // Range for v1.1.0 should be v1.0.0..v1.1.0 (2 commits)
      const r = resolveRange(dir, undefined, 'v1.1.0');
      expect(r.fromTag).toBe('v1.0.0');
      expect(r.commits).toHaveLength(2);

      // Range for the very first tag falls back to the whole history
      const r0 = resolveRange(dir, undefined, 'v1.0.0');
      expect(r0.commits).toHaveLength(1);

      // Default (HEAD) uses the latest tag
      const rHead = resolveRange(dir, undefined, 'HEAD');
      expect(rHead.fromTag).toBe('v1.1.0');
      expect(rHead.commits).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('tagBefore returns the nearest tag on the parent commit', () => {
    const dir = makeRepo();
    try {
      commit(dir, 'a');
      tag(dir, 'v0.1.0');
      commit(dir, 'b');
      tag(dir, 'v0.2.0');
      expect(tagBefore(dir, 'v0.2.0')).toBe('v0.1.0');
      expect(latestTag(dir)).toBe('v0.2.0');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
