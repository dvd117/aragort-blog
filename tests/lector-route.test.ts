import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';

const build = (env: NodeJS.ProcessEnv) => {
  rmSync('dist', { recursive: true, force: true });
  execFileSync('npx', ['astro', 'build'], { env: { ...process.env, ...env }, stdio: 'pipe' });
};

afterAll(() => rmSync('dist', { recursive: true, force: true }));

describe('the lector route is gated', () => {
  it('is absent from a build without the flag', () => {
    build({ ARAGORT_LECTOR: '' });
    expect(existsSync('dist/lector/index.html')).toBe(false);
  });

  it('is emitted with the flag, carries noindex, and stays out of the sitemap', () => {
    build({ ARAGORT_LECTOR: '1' });
    expect(existsSync('dist/lector/index.html')).toBe(true);
    const page = readFileSync('dist/lector/index.html', 'utf8');
    expect(page).toContain('name="robots" content="noindex, nofollow"');
    expect(page).toContain('class="progress"');
    expect(page).toContain('<button type="button" data-lector-read>Leer</button>');
    expect(readFileSync('dist/sitemap-0.xml', 'utf8')).not.toContain('/lector');
  });
});
