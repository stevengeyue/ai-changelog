import { describe, it, expect } from 'vitest';
import { bumpVersion, suggestBump, versionFromTag } from '../src/semver.js';
import { parseConventional } from '../src/commits.js';

function c(s: string) {
  return { subject: s, message: s, hash: 'h', shortHash: 'h', author: 'a', email: 'e', date: 'd', conventional: parseConventional(s) };
}

describe('suggestBump', () => {
  it('suggests major on breaking changes', () => {
    expect(suggestBump([c('feat!: breaking')])).toBe('major');
  });
  it('suggests minor on features', () => {
    expect(suggestBump([c('feat: new')])).toBe('minor');
  });
  it('suggests patch on fixes', () => {
    expect(suggestBump([c('fix: bug')])).toBe('patch');
  });
  it('suggests none without commits', () => {
    expect(suggestBump([])).toBe('none');
  });
});

describe('bumpVersion', () => {
  it('bumps major', () => {
    expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
  });
  it('bumps minor', () => {
    expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
  });
  it('bumps patch', () => {
    expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
  });
  it('handles missing version', () => {
    expect(bumpVersion(undefined, 'minor')).toBe('0.1.0');
  });
});

describe('versionFromTag', () => {
  it('extracts semver from tags', () => {
    expect(versionFromTag('v1.2.3')).toBe('1.2.3');
    expect(versionFromTag('release-2.0.1')).toBe('2.0.1');
    expect(versionFromTag(undefined)).toBeUndefined();
  });
});
