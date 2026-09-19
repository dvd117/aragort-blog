import { getCollection, type CollectionEntry } from 'astro:content';
import { countWords, isVisible, parsePostFilename, readingMinutes } from './posts';
import { hueFor, type Hue } from './hue';

export interface Post {
  entry: CollectionEntry<'posts'>;
  id: string;
  slug: string;
  date: string;
  title: string;
  description?: string;
  draft: boolean;
  hue: Hue;
  resumen?: string[];
  words: number;
  minutes: number;
  /** Path of the source file, relative to the project root. */
  file: string;
}

/** Published posts, newest first. Drafts appear only in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('posts', ({ data }) => isVisible(data, import.meta.env.DEV));
  const posts = entries
    .map((entry) => {
      const { date, slug } = parsePostFilename(`${entry.id}.md`);
      const words = countWords(entry.body ?? '');
      return {
        entry,
        id: entry.id,
        slug,
        date,
        title: entry.data.title,
        description: entry.data.description,
        draft: entry.data.draft ?? false,
        hue: hueFor(slug, entry.data.hue),
        resumen: entry.data.resumen,
        words,
        minutes: readingMinutes(words),
        file: entry.filePath ?? `src/content/posts/${entry.id}.md`,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  // Two files with the same slug and different dates would fight over one URL.
  const seen = new Map<string, string>();
  for (const p of posts) {
    const other = seen.get(p.slug);
    if (other) throw new Error(`Duplicate post slug "${p.slug}" in ${other}.md and ${p.id}.md`);
    seen.set(p.slug, p.id);
  }
  return posts;
}
