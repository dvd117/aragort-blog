import { describe, expect, it } from 'vitest';
import { postVersion, versionLine, type Git } from '../src/lib/versions';

/** A fake git that answers from a table, or throws for anything else. */
const fakeGit = (answers: Record<string, string>): Git => (args) => {
  const key = args[0] === 'rev-parse' ? 'shallow' : 'log';
  if (!(key in answers)) throw new Error(`unexpected git ${args.join(' ')}`);
  return answers[key]!;
};

const FILE = 'src/content/posts/2026-09-27-x.md';

describe('postVersion', () => {
  it('reads the count and the last commit date from full history', () => {
    const git = fakeGit({ shallow: 'false\n', log: '2026-10-02\n2026-09-28\n2026-09-20\n' });
    expect(postVersion(FILE, git)).toEqual({ count: 3, edited: '2026-10-02' });
  });

  it('returns null in a shallow clone, never a partial count', () => {
    const git = fakeGit({ shallow: 'true\n', log: '2026-10-02\n' });
    expect(postVersion(FILE, git)).toBeNull();
  });

  it('returns null when git is missing or this is not a repository', () => {
    const git: Git = () => { throw new Error('spawn git ENOENT'); };
    expect(postVersion(FILE, git)).toBeNull();
  });

  it('returns null when the file has no history yet', () => {
    const git = fakeGit({ shallow: 'false\n', log: '\n' });
    expect(postVersion(FILE, git)).toBeNull();
  });

  it('returns null on an unexpected answer to the shallow check', () => {
    const git = fakeGit({ shallow: '--is-shallow-repository\n', log: '2026-10-02\n' });
    expect(postVersion(FILE, git)).toBeNull();
  });
});

describe('versionLine', () => {
  const published = '2026-09-27';
  it('shows a real later edit', () => {
    expect(versionLine({ count: 3, edited: '2026-10-02' }, published)).toBe('v3 · editado 2026-10-02');
  });
  it('shows nothing for a single commit', () => {
    expect(versionLine({ count: 1, edited: '2026-10-02' }, published)).toBeNull();
  });
  it('shows nothing when the last edit is not after the filename date', () => {
    expect(versionLine({ count: 4, edited: '2026-09-27' }, published)).toBeNull();
    expect(versionLine({ count: 4, edited: '2026-09-20' }, published)).toBeNull();
  });
  it('shows nothing without history', () => {
    expect(versionLine(null, published)).toBeNull();
  });
});
