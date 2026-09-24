import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GROUNDS, LINES, STATIONS } from '../src/data/metro';
import { ratio } from '../src/lib/contrast';

describe('metro source data', () => {
  it('defines the five ordered lines with both direction colours', () => {
    expect(LINES).toEqual([
      { id: 'l1', num: 1, name: 'El punto de quiebre', colour: { pol: '#d4501a', anden: '#f2792b' } },
      { id: 'l2', num: 2, name: 'Las herramientas del practicante', colour: { pol: '#a67c00', anden: '#f3c12e' } },
      { id: 'l3', num: 3, name: 'La infraestructura propia', colour: { pol: '#1c5fae', anden: '#4e93e6' } },
      { id: 'l4', num: 4, name: 'El contexto del sector', colour: { pol: '#1b7f45', anden: '#35b168' } },
      { id: 'l5', num: 5, name: 'Otros escritos', colour: { pol: '#566170', anden: '#8f98a3' } },
    ]);
  });

  it('defines the exact shared grounds and eleven unique stations', () => {
    expect(GROUNDS).toEqual({
      pol: { bg: '#f1ebdd', ink: '#17140f', ink2: '#5a5246' },
      anden: { bg: '#0b0c0e', fg: '#ecebe6', fg2: '#9ea3aa' },
    });
    expect(STATIONS).toHaveLength(11);
    expect(new Set(STATIONS.map((station) => station.id)).size).toBe(11);
  });

  it('stores every station title, map label, home line and coordinate verbatim', () => {
    expect(STATIONS).toEqual([
      { id: 'chatbots', title: 'Por qué dejé los chatbots', label: 'Por qué dejé\nlos chatbots', home: 'l1', slug: 'por-que-deje-los-chatbots', pos: [0, 6], labelSide: 'N' },
      { id: 'terminal', title: 'La terminal y GitHub', label: 'La terminal\ny GitHub', home: 'l2', pos: [4, 6], labelSide: 'S' },
      { id: 'instrucciones', title: 'Tus instrucciones, tus reglas', label: 'Tus instrucciones,\ntus reglas', home: 'l2', pos: [4, 4], labelSide: 'E' },
      { id: 'usalos', title: 'Úsalos todos', label: 'Úsalos todos', home: 'l2', pos: [4, 2], labelSide: 'E' },
      { id: 'nodependas', title: 'No dependas de una sola empresa', label: 'No dependas de\nuna sola empresa', home: 'l2', pos: [6, 0], labelSide: 'E' },
      { id: 'markdown', title: 'Markdown como sustrato', label: 'Markdown\ncomo sustrato', home: 'l3', pos: [8, 6], labelSide: 'N' },
      { id: 'sincronizo', title: 'Cómo sincronizo todo', label: 'Cómo sincronizo\ntodo', home: 'l3', pos: [8, 8], labelSide: 'E' },
      { id: 'wiki', title: 'Mi wiki personal con LLMs', label: 'Mi wiki personal\ncon LLMs', home: 'l3', pos: [10, 10], labelSide: 'E' },
      { id: 'carrera', title: 'La carrera de los modelos', label: 'La carrera de\nlos modelos', home: 'l4', pos: [12, 6], labelSide: 'S' },
      { id: 'anthropic', title: 'Anthropic y los cambios de política', label: 'Anthropic y los\ncambios de política', home: 'l4', pos: [14, 4], labelSide: 'E' },
      { id: 'cuba', title: 'El acceso a Internet como nuevo motor de la movilización social en Cuba', label: 'Internet\nen Cuba', home: 'l5', slug: 'acceso-a-internet-y-movilizacion-social-en-cuba', pos: [0, 8], labelSide: 'E' },
    ]);
  });

  it('marks exactly the live stations and each slug exists as a post', () => {
    const live = STATIONS.filter((station) => station.slug);
    const postFiles = readdirSync('src/content/posts');
    expect(live.map(({ id, slug }) => [id, slug])).toEqual([
      ['chatbots', 'por-que-deje-los-chatbots'],
      ['cuba', 'acceso-a-internet-y-movilizacion-social-en-cuba'],
    ]);
    expect(live).toHaveLength(2);
    for (const station of live) {
      const postFile = postFiles.find((file) => file.endsWith(`-${station.slug}.md`));
      expect(postFile).toBeDefined();
      expect(existsSync(`src/content/posts/${postFile}`)).toBe(true);
    }
  });

  it('keeps every line colour at 3:1 and every ground text colour at 4.5:1', () => {
    for (const line of LINES) {
      expect(ratio(line.colour.pol, GROUNDS.pol.bg)).toBeGreaterThanOrEqual(3);
      expect(ratio(line.colour.anden, GROUNDS.anden.bg)).toBeGreaterThanOrEqual(3);
    }
    expect(ratio(GROUNDS.pol.ink, GROUNDS.pol.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(GROUNDS.pol.ink2, GROUNDS.pol.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(GROUNDS.anden.fg, GROUNDS.anden.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(GROUNDS.anden.fg2, GROUNDS.anden.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps em and en dashes out of the data strings', () => {
    expect(JSON.stringify({ LINES, GROUNDS, STATIONS })).not.toMatch(/[—–]/);
  });
});
