import { globSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FORBIDDEN = ['aragort-net-from', 'morphFrom', 'arriveOnRail'];
const files = globSync('src/**/*').filter((file) => statSync(file).isFile());

describe('the hero-to-rail net glide is removed', () => {
  it('leaves no net-morph implementation references under src', () => {
    const offenders = files.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return FORBIDDEN.filter((token) => source.includes(token)).map((token) => `${file}: ${token}`);
    });

    expect(offenders).toEqual([]);
  });
});
