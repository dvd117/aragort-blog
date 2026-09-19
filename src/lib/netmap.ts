/**
 * Landing -> post: the hero (40 nodes) folds into the rail (42 nodes). Both nets index
 * their nodes in reading order (hero by x, rail by y), so rail node i starts from the
 * hero node at the same place in that order.
 */
export function mapByOrder(from: number, to: number): number[] {
  if (from < 1 || to < 1) return [];
  if (to === 1) return [0];
  return Array.from({ length: to }, (_, i) => Math.round((i * (from - 1)) / (to - 1)));
}
