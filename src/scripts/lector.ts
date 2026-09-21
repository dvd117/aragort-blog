/**
 * Lector: someone else's Markdown, read the way a post is read.
 *
 * Everything is local. The document is rendered in the browser, held in
 * sessionStorage so a reload does not lose it, and forgotten when the tab closes --
 * a pasted document is often someone's private notes and has no business outliving
 * the tab on a shared machine.
 *
 * "Otro texto" disposes the reading controllers and mounts the next document in
 * place, which is why reading.ts and threads.ts return disposers.
 */
import { mountReading } from './reading.ts';
import { mountThreads } from './threads.ts';
import { renderMarkdown } from './lector-render.ts';
import { tooLarge } from '../lib/lector-doc.ts';

const KEY = 'aragort-lector';
const TOO_BIG = 'Ese archivo es demasiado grande para leerlo aquí (el límite son 2 MB).';
const UNREADABLE = 'No se pudo leer ese archivo.';
// TODO(david): copy.
const UNSUPPORTED = 'Ese archivo no parece Markdown o texto plano.';

export function initLector(): void {
  const page = document.querySelector<HTMLElement>('.lector');
  const empty = page?.querySelector<HTMLElement>('[data-lector-empty]');
  const shell = page?.querySelector<HTMLElement>('[data-lector-shell]');
  const prose = shell?.querySelector<HTMLElement>('.prose');
  const sourcePane = shell?.querySelector<HTMLElement>('[data-lector-source]');
  const titleEl = shell?.querySelector<HTMLElement>('[data-lector-title]');
  const minutesEl = shell?.querySelector<HTMLElement>('[data-lector-minutes]');
  const toc = shell?.querySelector<HTMLElement>('.rail-toc');
  const area = page?.querySelector<HTMLTextAreaElement>('[data-lector-paste]');
  const status = page?.querySelector<HTMLElement>('[data-lector-status]');
  if (!page || !empty || !shell || !prose || !sourcePane || !titleEl || !minutesEl || !toc || !area || !status) return;

  const disposers: Array<() => void> = [];
  let inputGeneration = 0;
  const site = document.querySelector<HTMLElement>('header.site');
  const progress = document.querySelector<HTMLElement>('.progress');
  const left = document.querySelector<HTMLElement>('[data-left]');
  const initialSiteClass = site?.getAttribute('class') ?? null;
  const initialMarkClasses = site
    ? [...site.querySelectorAll<HTMLElement>('.brand .net, .brand .net *')].map((element) => ({ element, className: element.getAttribute('class') }))
    : [];
  const initialProgressStyle = progress?.getAttribute('style') ?? null;
  const initialLeftText = left?.textContent ?? '';
  const reservedIds = [...document.querySelectorAll<HTMLElement>('[id]')]
    .filter((element) => !shell.contains(element))
    .map((element) => element.id);
  const copy = shell.querySelector<HTMLButtonElement>('[data-copy]');
  let copyReset = 0;
  const teardown = () => { for (const dispose of disposers.splice(0)) dispose(); };

  const restoreHeader = () => {
    if (site) {
      if (initialSiteClass === null) site.removeAttribute('class');
      else site.setAttribute('class', initialSiteClass);
    }
    initialMarkClasses.forEach(({ element, className }) => {
      if (className === null) element.removeAttribute('class');
      else element.setAttribute('class', className);
    });
    if (progress) {
      if (initialProgressStyle === null) progress.removeAttribute('style');
      else progress.setAttribute('style', initialProgressStyle);
    }
    if (left) left.textContent = initialLeftText;
  };

  const resetShell = () => {
    clearTimeout(copyReset);
    copyReset = 0;
    for (const button of shell.querySelectorAll<HTMLButtonElement>('[data-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.view === 'read'));
    }
    for (const pane of shell.querySelectorAll<HTMLElement>('[data-pane]')) {
      pane.hidden = pane.dataset.pane !== 'read';
    }
    if (copy) {
      delete copy.dataset.state;
      const label = copy.querySelector('span');
      if (label) label.textContent = 'Copiar';
    }
    shell.querySelectorAll<Element>('[data-done]').forEach((card) => card.classList.remove('show', 'pending'));
    shell.querySelectorAll<Element>('.pulse').forEach((net) => net.classList.remove('pulse'));
    document.querySelectorAll<Element>('.site .brand .net.pulse').forEach((net) => net.classList.remove('pulse'));
    restoreHeader();
  };

  const say = (message: string) => { status.textContent = message; };

  /** The rail's chapter list, which the post page renders at build time. */
  const buildToc = (chapters: Array<{ id: string; text: string }>) => {
    const list = toc.querySelector('ol')!;
    list.replaceChildren();
    chapters.forEach((chapter, i) => {
      const a = document.createElement('a');
      a.href = `#${chapter.id}`;
      a.dataset.chapter = String(i);
      const num = document.createElement('span');
      num.className = 'num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = String(i + 1).padStart(2, '0');
      const ttl = document.createElement('span');
      ttl.className = 'ttl';
      ttl.textContent = chapter.text;
      a.append(num, ttl);
      const li = document.createElement('li');
      li.append(a);
      list.append(li);
    });
    // Three chapters is where an index earns its place, as on a post.
    const enough = chapters.length >= 3;
    toc.hidden = !enough;
    shell.toggleAttribute('data-has-rail-toc', enough);
  };

  const show = (source: string, filename?: string) => {
    if (tooLarge(source)) { say(TOO_BIG); return; }
    teardown();
    resetShell();
    const doc = renderMarkdown(source, filename, reservedIds);
    titleEl.textContent = doc.title;
    minutesEl.textContent = `${doc.minutes} min de lectura`;
    prose.innerHTML = doc.html;
    sourcePane.textContent = source;
    shell.dataset.minutes = String(doc.minutes);
    buildToc(doc.chapters);
    empty.hidden = true;
    shell.hidden = false;
    say('');
    try { sessionStorage.setItem(KEY, JSON.stringify({ source, filename })); } catch { /* private mode */ }
    disposers.push(mountReading(shell, { minutes: doc.minutes }), mountThreads(shell));
    titleEl.focus?.();
  };

  const reset = () => {
    inputGeneration += 1;
    teardown();
    resetShell();
    prose.replaceChildren();
    sourcePane.textContent = '';
    titleEl.textContent = '';
    minutesEl.textContent = '';
    toc.querySelector('ol')!.replaceChildren();
    toc.hidden = true;
    shell.removeAttribute('data-has-rail-toc');
    shell.hidden = true;
    empty.hidden = false;
    area.value = '';
    say('');
    try { sessionStorage.removeItem(KEY); } catch { /* private mode */ }
    area.focus();
  };

  const readFile = (file: File | null | undefined) => {
    if (!file) return;
    const nameAllowed = /\.(?:md|markdown|txt)$/i.test(file.name);
    const typeAllowed = file.type === 'text/markdown' || file.type === 'text/plain';
    if (!nameAllowed && !typeAllowed) { say(UNSUPPORTED); return; }
    const generation = ++inputGeneration;
    if (file.size > 2 * 1024 * 1024) { say(TOO_BIG); return; }
    file.text()
      .then((text) => { if (generation === inputGeneration) show(text, file.name); })
      .catch(() => { if (generation === inputGeneration) say(UNREADABLE); });
  };

  page.querySelector<HTMLButtonElement>('[data-lector-read]')
    ?.addEventListener('click', () => {
      if (area.value.trim()) {
        inputGeneration += 1;
        show(area.value);
      }
    });
  page.querySelector<HTMLButtonElement>('[data-lector-reset]')
    ?.addEventListener('click', reset);
  page.querySelector<HTMLInputElement>('[data-lector-file]')
    ?.addEventListener('change', (e) => readFile((e.target as HTMLInputElement).files?.[0]));

  // The whole page is the drop target: a file dropped anywhere is a file meant for this.
  const drop = page.querySelector<HTMLElement>('[data-lector-drop]');
  document.addEventListener('dragover', (e) => { e.preventDefault(); drop?.classList.add('is-over'); });
  document.addEventListener('dragleave', (e) => { if (e.relatedTarget === null) drop?.classList.remove('is-over'); });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    drop?.classList.remove('is-over');
    readFile(e.dataTransfer?.files?.[0]);
  });

  // Copiar: the same text the reader pasted in.
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(sourcePane.textContent ?? ''); } catch { return; }
    const label = copy.querySelector('span')!;
    copy.dataset.state = 'done';
    label.textContent = 'Copiado';
    clearTimeout(copyReset);
    copyReset = window.setTimeout(() => { delete copy.dataset.state; label.textContent = 'Copiar'; copyReset = 0; }, 2000);
  });

  // Formato / Markdown, as on a post.
  const views = [...shell.querySelectorAll<HTMLButtonElement>('[data-view]')];
  for (const button of views) {
    button.addEventListener('click', () => {
      for (const other of views) other.setAttribute('aria-pressed', String(other === button));
      for (const pane of shell.querySelectorAll<HTMLElement>('[data-pane]')) {
        pane.hidden = pane.dataset.pane !== button.dataset.view;
      }
    });
  }

  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const { source, filename } = JSON.parse(saved) as { source?: string; filename?: string };
      if (typeof source === 'string' && source) show(source, filename);
    }
  } catch { /* corrupt or unavailable storage: start empty */ }
}
