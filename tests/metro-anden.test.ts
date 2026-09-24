import { describe, expect, it } from 'vitest';
import { buildAndenLines, type MetroPostSummary } from '../src/lib/metro-map';

const posts: MetroPostSummary[] = [
  {
    slug: 'por-que-deje-los-chatbots',
    title: 'Por qué dejé los chatbots',
    date: '2026-09-27',
    description: 'Una descripción real del ensayo.',
    minutes: 8,
  },
  {
    slug: 'acceso-a-internet-y-movilizacion-social-en-cuba',
    title: 'El acceso a Internet como nuevo motor de la movilización social en Cuba',
    date: '2026-09-25',
    description: 'Otra descripción real.',
    minutes: 12,
  },
];

describe('Andén landing route model', () => {
  it('builds all five strips in riding order and derives each direction from its last stop', () => {
    const lines = buildAndenLines(posts);

    expect(lines.map(({ line, destination, stops }) => [
      line.id,
      destination.id,
      stops.map(({ station }) => station.id),
    ])).toEqual([
      ['l1', 'carrera', ['chatbots', 'terminal', 'markdown', 'carrera']],
      ['l2', 'nodependas', ['terminal', 'instrucciones', 'usalos', 'nodependas']],
      ['l3', 'wiki', ['markdown', 'sincronizo', 'wiki']],
      ['l4', 'anthropic', ['carrera', 'anthropic']],
      ['l5', 'cuba', ['chatbots', 'cuba']],
    ]);
  });

  it('attaches live post details and one transfer per other line while planned stops stay unlinked', () => {
    const lines = buildAndenLines(posts);

    expect(lines[0]?.stops[0]).toMatchObject({
      station: { id: 'chatbots', slug: 'por-que-deje-los-chatbots' },
      post: { title: 'Por qué dejé los chatbots', description: 'Una descripción real del ensayo.', minutes: 8 },
      transfers: [{ id: 'l5' }],
    });
    expect(lines[0]?.stops[1]).toMatchObject({
      station: { id: 'terminal' },
      post: undefined,
      transfers: [{ id: 'l2' }],
    });
    expect(lines[4]?.stops[1]).toMatchObject({
      station: { id: 'cuba' },
      post: { slug: 'acceso-a-internet-y-movilizacion-social-en-cuba' },
      transfers: [],
    });
  });
});
