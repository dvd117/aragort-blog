interface LitMarker {
  dataset: { lit?: string };
}

type RideOrientation = 'horizontal' | 'vertical';

export function rideAxis(orientation: RideOrientation | undefined, narrowViewport: boolean): 'x' | 'y' {
  if (orientation === 'horizontal') return 'x';
  if (orientation === 'vertical') return 'y';
  return narrowViewport ? 'x' : 'y';
}

export function markStopLit(marker: LitMarker): boolean {
  if (marker.dataset.lit === 'true') return false;
  marker.dataset.lit = 'true';
  return true;
}

export function advanceHighWater(previous: number, current: number): number {
  return Math.max(previous, Math.min(1, Math.max(0, current)));
}

export function chapterProgress(positions: number[], readingLine: number): number {
  if (positions.length < 2) return 0;
  const span = positions[positions.length - 1]! - positions[0]!;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (readingLine - positions[0]!) / span));
}

export function currentChapterIndex(positions: number[], readingLine: number): number {
  let current = 0;
  for (const [index, position] of positions.entries()) {
    if (position > readingLine) break;
    current = index;
  }
  return current;
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

function initChapterStrip(): void {
  const strip = document.querySelector<HTMLElement>('[data-ride-strip]');
  const list = strip?.querySelector<HTMLElement>('[data-ride-stations]');
  const train = list?.querySelector<HTMLElement>('[data-ride-train]');
  const stations = Array.from(list?.querySelectorAll<HTMLElement>('[data-ride-station]') ?? []);
  if (!strip || !list || !train || stations.length < 2) return;

  const headings = stations.map((station) => {
    const href = station.getAttribute('href') ?? '';
    if (!href.startsWith('#')) return null;
    try {
      return document.getElementById(decodeURIComponent(href.slice(1)));
    } catch {
      return null;
    }
  }).filter((heading): heading is HTMLElement => heading instanceof HTMLElement);
  if (headings.length !== stations.length) return;

  let furthest = 0;
  let frame = 0;
  const update = () => {
    const requestedOrientation = strip.dataset.rideOrientation;
    const orientation = requestedOrientation === 'horizontal' || requestedOrientation === 'vertical'
      ? requestedOrientation
      : undefined;
    const axis = rideAxis(orientation, window.matchMedia('(max-width: 999px)').matches);
    const horizontal = axis === 'x';
    list.dataset.rideAxis = axis;
    const listRect = list.getBoundingClientRect();
    const dotRects = stations.map((station) => station.querySelector<HTMLElement>('[data-ride-dot]')!.getBoundingClientRect());
    const first = dotRects[0]!;
    const last = dotRects[dotRects.length - 1]!;
    const firstX = first.left + first.width / 2 - listRect.left;
    const firstY = first.top + first.height / 2 - listRect.top;
    const lastX = last.left + last.width / 2 - listRect.left;
    const lastY = last.top + last.height / 2 - listRect.top;
    list.style.setProperty('--ride-track-x', `${firstX}px`);
    list.style.setProperty('--ride-track-y', `${firstY}px`);
    list.style.setProperty('--ride-track-width', `${lastX - firstX}px`);
    list.style.setProperty('--ride-track-height', `${lastY - firstY}px`);

    const headingPositions = headings.map((heading) => heading.getBoundingClientRect().top + window.scrollY);
    const readingLine = window.scrollY + window.innerHeight * .65;
    const active = currentChapterIndex(headingPositions, readingLine);
    stations.forEach((station, index) => {
      if (index === active) station.setAttribute('aria-current', 'location');
      else station.removeAttribute('aria-current');
    });

    const currentTitle = strip.querySelector<HTMLElement>('[data-ride-current-title]');
    const activeTitle = stations[active]?.querySelector<HTMLElement>('.metro-ride-title')?.textContent?.trim() ?? '';
    if (currentTitle && currentTitle.textContent !== activeTitle) currentTitle.textContent = activeTitle;

    furthest = advanceHighWater(furthest, chapterProgress(headingPositions, readingLine));
    const carWidth = train.getBoundingClientRect().width || 26;
    const carHeight = train.getBoundingClientRect().height || 9;
    const startX = firstX - carWidth / 2;
    const startY = firstY - carHeight / 2;
    const x = horizontal ? startX + (lastX - firstX) * furthest : startX;
    const y = horizontal ? startY : startY + (lastY - firstY) * furthest;
    train.style.setProperty('--ride-x', `${x}px`);
    train.style.setProperty('--ride-y', `${y}px`);
    train.dataset.moving = String(furthest > 0);
    strip.dataset.rideReady = 'true';
  };

  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  document.fonts?.ready.then(schedule);
}

export function initMetroRide(): void {
  initServiceStops();
  initChapterStrip();
}
