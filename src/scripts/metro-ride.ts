interface LitMarker {
  dataset: { lit?: string };
}

export function markStopLit(marker: LitMarker): boolean {
  if (marker.dataset.lit === 'true') return false;
  marker.dataset.lit = 'true';
  return true;
}

export function advanceHighWater(previous: number, current: number): number {
  return Math.max(previous, Math.min(1, Math.max(0, current)));
}

function initServiceStops(): void {
  const markers = document.querySelectorAll<HTMLElement>('[data-stop-marker]');
  if (!markers.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      markStopLit(entry.target as HTMLElement);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '-64% 0px -34% 0px' });

  markers.forEach((marker) => observer.observe(marker));
}

export function initMetroRide(): void {
  initServiceStops();
}
