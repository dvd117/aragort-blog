/**
 * Reading a document that is not ours: frontmatter, a title, a length.
 *
 * A pasted README usually opens with a YAML block. Left in place its opening ---
 * reaches rehype-net-divider and becomes a net divider with `title: x` loose
 * underneath, so it is stripped before parsing. Only `title:` is read out of it;
 * anything else in the block is not ours to interpret, and a YAML parser would be
 * a dependency for one line.
 */

/** Only ever matches at the very start, so a divider later in the text survives. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?(?:\r?\n)?/;
const TITLE_LINE = /^title:[ \t]*(.+?)[ \t]*$/m;

/** 2 MB. Micromark is fast, but a larger paste would lock a mid-range phone. */
export const MAX_BYTES = 2 * 1024 * 1024;

export const tooLarge = (source: string): boolean => new TextEncoder().encode(source).byteLength > MAX_BYTES;

export function stripFrontmatter(source: string): { body: string; title: string | null } {
  const match = FRONTMATTER.exec(source);
  if (!match) return { body: source, title: null };
  const line = TITLE_LINE.exec(match[1] ?? '');
  const raw = line?.[1]?.trim() ?? '';
  const title = raw.replace(/^['"]|['"]$/g, '').trim();
  return { body: source.slice(match[0].length), title: title || null };
}

export function documentTitle(parts: {
  frontmatter: string | null;
  heading: string | null;
  filename?: string;
}): string {
  return parts.frontmatter || parts.heading || parts.filename || 'Sin título';
}

export const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;
