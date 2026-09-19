/** Below this many posts the landing features the latest one instead of a plain list. */
export const FEATURE_BELOW = 3;
export type LandingMode = 'empty' | 'featured' | 'list';
export const landingMode = (count: number): LandingMode =>
  count === 0 ? 'empty' : count < FEATURE_BELOW ? 'featured' : 'list';
