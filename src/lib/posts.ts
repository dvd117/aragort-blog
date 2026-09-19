/**
 * Pure helpers for posts. No Astro imports, so they can be tested directly.
 *
 * A post file is named YYYY-MM-DD-slug.md. The date comes from the filename,
 * the slug is the rest. Renaming the file is how a post moves.
 */

const FILENAME = /^(\d{4})-(\d{2})-(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

export interface PostName {
  /** ISO date, YYYY-MM-DD */
  date: string;
  slug: string;
}

export class PostFilenameError extends Error {
  constructor(filename: string, reason: string) {
    super(`Invalid post filename "${filename}": ${reason}. Expected YYYY-MM-DD-slug.md (slug in lowercase letters, digits and hyphens).`);
    this.name = 'PostFilenameError';
  }
}

export function parsePostFilename(filename: string): PostName {
  const base = filename.split('/').pop() ?? filename;
  const m = FILENAME.exec(base);
  if (!m) throw new PostFilenameError(base, 'does not match the pattern');
  const [, y, mo, d, slug] = m;
  const date = `${y}-${mo}-${d}`;
  const t = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== date) {
    throw new PostFilenameError(base, `"${date}" is not a real date`);
  }
  return { date, slug: slug! };
}

const LONG = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "2026-09-27" -> "27 de septiembre de 2026" */
export function formatDateEs(iso: string): string {
  return LONG.format(new Date(`${iso}T00:00:00Z`));
}

/** Word count of a Markdown body (no frontmatter), ignoring syntax and URLs. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\^[^\]]+\]:?/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');
  return text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

/** Minutes at 220 words per minute, never less than one. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 220));
}
