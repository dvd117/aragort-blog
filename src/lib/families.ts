/**
 * Type families under consideration (v3 specimen). The site ships ONE family,
 * chosen at build time with ARAGORT_FAMILY (default below). The preview build
 * (ARAGORT_SPECIMEN=1) ships all four plus a switcher.
 */
export const FAMILIES = {
  bricolage: { key: 'A', name: 'Bricolage Grotesque', preload: 'bricolage.woff2', fonts: ['bricolage.woff2', 'jetbrains-mono.woff2', 'bricolagegrotesque-OFL.txt', 'jetbrainsmono-OFL.txt'], og: 'bricolage-700.ttf' },
  schibsted: { key: 'B', name: 'Schibsted Grotesk', preload: 'schibsted.woff2', fonts: ['schibsted.woff2', 'schibsted-italic.woff2', 'jetbrains-mono.woff2', 'schibstedgrotesk-OFL.txt', 'jetbrainsmono-OFL.txt'], og: 'schibsted-700.ttf' },
  geist: { key: 'C', name: 'Geist', preload: 'geist.woff2', fonts: ['geist.woff2', 'geist-italic.woff2', 'geist-mono.woff2', 'geist-OFL.txt', 'geistmono-OFL.txt'], og: 'geist-700.ttf' },
  space: { key: 'D', name: 'Space Grotesk', preload: 'space-grotesk.woff2', fonts: ['space-grotesk.woff2', 'space-mono.woff2', 'space-mono-bold.woff2', 'spacegrotesk-OFL.txt', 'spacemono-OFL.txt'], og: 'space-700.ttf' },
} as const;

export type Family = keyof typeof FAMILIES;
export const DEFAULT_FAMILY: Family = 'geist';

export function buildFamily(env: Record<string, string | undefined> = process.env): Family {
  const f = env.ARAGORT_FAMILY;
  return f && f in FAMILIES ? (f as Family) : DEFAULT_FAMILY;
}

/** Font files shipped by a build: the chosen family's, or every family's in the preview. */
export function shippedFonts(family: Family, preview: boolean): Set<string> {
  const list = preview ? Object.values(FAMILIES).flatMap((f) => f.fonts) : FAMILIES[family].fonts;
  return new Set(list);
}
