import { describe, expect, it } from 'vitest';
import { commitDates, postVersion, versionFromDates, versionLine, type Git } from '../src/lib/versions';

/** A fake git that answers from a table, or throws for anything else. */
const fakeGit = (answers: Record<string, string>): Git => (args) => {
  const key = args[0] === 'rev-parse' ? 'shallow' : 'log';
  if (!(key in answers)) throw new Error(`unexpected git ${args.join(' ')}`);
  return answers[key]!;
};

const FILE = 'src/content/posts/2026-09-27-x.md';
const PUBLISHED = '2026-09-27';

describe('commitDates (history fallback)', () => {
  it('reads commit dates from full history, newest first', () => {
    const git = fakeGit({ shallow: 'false\n', log: '2026-10-02\n2026-09-28\n2026-09-20\n' });
    expect(commitDates(FILE, git)).toEqual(['2026-10-02', '2026-09-28', '2026-09-20']);
  });
  it('returns null in a shallow clone, never a partial history', () => {
    expect(commitDates(FILE, fakeGit({ shallow: 'true\n', log: '2026-10-02\n' }))).toBeNull();
  });
  it('returns null when git is missing or this is not a repository', () => {
    const git: Git = () => { throw new Error('spawn git ENOENT'); };
    expect(commitDates(FILE, git)).toBeNull();
  });
  it('returns null when the file has no history yet', () => {
    expect(commitDates(FILE, fakeGit({ shallow: 'false\n', log: '\n' }))).toBeNull();
  });
  it('returns null on an unexpected answer to the shallow check', () => {
    expect(commitDates(FILE, fakeGit({ shallow: '--is-shallow-repository\n', log: '2026-10-02\n' }))).toBeNull();
  });
});

describe('versions count from the publish date', () => {
  it('is v1 at publication, whatever the drafting history', () => {
    expect(versionFromDates(['2026-09-27', '2026-09-20', '2026-09-18', '2026-09-10'], PUBLISHED)).toEqual({ count: 1, edited: null });
  });
  it('adds one per commit after the publish date', () => {
    expect(versionFromDates(['2026-10-02', '2026-09-28', '2026-09-20', '2026-09-18'], PUBLISHED)).toEqual({ count: 3, edited: '2026-10-02' });
  });
  it('does not count a commit on the publish date itself', () => {
    expect(versionFromDates(['2026-09-27', '2026-09-27'], PUBLISHED)).toEqual({ count: 1, edited: null });
  });
  it('counts edits even when all history is after the date (a post renamed to an earlier date)', () => {
    expect(versionFromDates(['2026-10-05', '2026-10-01'], PUBLISHED)).toEqual({ count: 3, edited: '2026-10-05' });
  });
  it('has no version without history', () => {
    expect(versionFromDates(null, PUBLISHED)).toBeNull();
  });
  it('wires history and counting together', () => {
    const git = fakeGit({ shallow: 'false\n', log: '2026-10-02\n2026-09-20\n' });
    expect(postVersion(FILE, PUBLISHED, git)).toEqual({ count: 2, edited: '2026-10-02' });
    expect(postVersion(FILE, PUBLISHED, fakeGit({ shallow: 'true\n', log: '' }))).toBeNull();
  });
});

describe('versionLine', () => {
  it('shows an edited post', () => {
    expect(versionLine({ count: 3, edited: '2026-10-02' })).toBe('v3 · editado 2026-10-02');
  });
  it('shows nothing for v1', () => {
    expect(versionLine({ count: 1, edited: null })).toBeNull();
  });
  it('shows nothing without history', () => {
    expect(versionLine(null)).toBeNull();
  });
});
