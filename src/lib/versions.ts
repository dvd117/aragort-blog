/**
 * Post versions from git history, computed at build time.
 *
 * A version line ("v3 · editado 2026-10-02") shows only when the file has more
 * than one commit and its last commit is after the filename date. When history
 * is missing or incomplete (no git, not a repo, a shallow clone as Dokploy may
 * make) this returns null and the page shows nothing: never a wrong number.
 */
import { execFileSync } from 'node:child_process';

export interface Version {
  count: number;
  /** ISO date of the last commit that touched the file */
  edited: string;
}

export type Git = (args: string[]) => string;

const realGit: Git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

export function postVersion(file: string, git: Git = realGit): Version | null {
  try {
    if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') return null;
    // --follow keeps history across renames: renaming the file is how a post changes date.
    const dates = git(['log', '--follow', '--format=%cs', '--', file])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (dates.length === 0) return null;
    return { count: dates.length, edited: dates[0]! };
  } catch {
    return null;
  }
}

/** The line is shown only for a real later edit. */
export function versionLine(v: Version | null, published: string): string | null {
  if (!v || v.count <= 1 || v.edited <= published) return null;
  return `v${v.count} · editado ${v.edited}`;
}
