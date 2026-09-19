/**
 * Post versions from git history, computed at build time.
 *
 * Versions count from the publish date (the filename date): the post is v1 when
 * published, and each commit to the file after that date adds one. Drafting
 * commits on or before the date do not count. The line ("v3 · editado
 * 2026-10-02") shows only from v2 on.
 *
 * When history is missing or incomplete (no git, not a repo, a shallow clone)
 * this returns null and the page shows nothing: never a wrong number.
 */
import { execFileSync } from 'node:child_process';

export interface Version {
  /** 1 at publication, +1 per commit after the publish date */
  count: number;
  /** ISO date of the last commit after the publish date, or null for v1 */
  edited: string | null;
}

export type Git = (args: string[]) => string;

const realGit: Git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

/** Commit dates (newest first) of a file, or null when history can't be trusted. */
export function commitDates(file: string, git: Git = realGit): string[] | null {
  try {
    if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') return null;
    // --follow keeps history across renames: renaming the file is how a post changes date.
    const dates = git(['log', '--follow', '--format=%cs', '--', file])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    return dates.length ? dates : null;
  } catch {
    return null;
  }
}

/** Version from commit dates and the publish date. Pure, so it can be tested. */
export function versionFromDates(dates: string[] | null, published: string): Version | null {
  if (!dates) return null;
  const after = dates.filter((d) => d > published);
  return { count: 1 + after.length, edited: after[0] ?? null };
}

export function postVersion(file: string, published: string, git: Git = realGit): Version | null {
  return versionFromDates(commitDates(file, git), published);
}

/** The line is shown only once a post has been edited after publication. */
export function versionLine(v: Version | null): string | null {
  if (!v || v.count <= 1 || !v.edited) return null;
  return `v${v.count} · editado ${v.edited}`;
}
