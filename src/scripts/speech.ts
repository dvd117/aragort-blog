/**
 * Leer en voz alta. Web Speech API only, with a local Spanish voice
 * (es-419 / es-VE first): no network speech services. If there is none,
 * the control stays hidden. The sentence being read is highlighted with the
 * CSS Custom Highlight API (no DOM changes), or its paragraph as a fallback.
 */
import { reduced } from './motion';

const PREFERRED = ['es-419', 'es-ve', 'es-us', 'es-mx', 'es-co', 'es-ar', 'es-cl', 'es-es'];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const local = voices.filter((v) => v.localService && v.lang.toLowerCase().replace('_', '-').startsWith('es'));
  for (const p of PREFERRED) {
    const v = local.find((x) => x.lang.toLowerCase().replace('_', '-') === p);
    if (v) return v;
  }
  return local[0] ?? null;
}

function voicesReady(): Promise<SpeechSynthesisVoice[]> {
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

interface Sentence { block: HTMLElement; start: number; end: number; text: string; }

function splitSentences(block: HTMLElement): Sentence[] {
  const text = block.textContent ?? '';
  const out: Sentence[] = [];
  const push = (start: number, end: number) => {
    const t = text.slice(start, end).trim();
    if (t) out.push({ block, start, end, text: t });
  };
  if ('Segmenter' in Intl) {
    for (const s of new Intl.Segmenter('es', { granularity: 'sentence' }).segment(text)) push(s.index, s.index + s.segment.length);
  } else {
    const re = /[^.!?…]+[.!?…]+["»”’)]*\s*|[^.!?…]+$/g;
    for (let m; (m = re.exec(text)); ) push(m.index, m.index + m[0].length);
  }
  return out;
}

function rangeFor(s: Sentence): Range | null {
  const walker = document.createTreeWalker(s.block, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0;
  let started = false;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (!started && s.start < pos + len) { range.setStart(n, s.start - pos); started = true; }
    if (started && s.end <= pos + len) { range.setEnd(n, s.end - pos); return range; }
    pos += len;
  }
  return null;
}

export async function initSpeech(section: HTMLElement): Promise<void> {
  const voice = pickVoice(await voicesReady());
  if (!voice) return; // no local Spanish voice: the control never appears

  const play = section.querySelector<HTMLButtonElement>('[data-voz-play]')!;
  const stop = section.querySelector<HTMLButtonElement>('[data-voz-stop]')!;
  const rate = section.querySelector<HTMLSelectElement>('[data-voz-rate]')!;
  const status = section.querySelector<HTMLElement>('[data-voz-status]')!;
  const blocks = [...document.querySelectorAll<HTMLElement>('.post .prose > :is(p, li, blockquote), .post .prose > :is(ul, ol) > li')];
  const sentences = blocks.flatMap(splitSentences);
  const canHighlight = 'highlights' in CSS && typeof Highlight === 'function';

  let index = 0;
  let mode: 'idle' | 'playing' | 'paused' = 'idle';
  let lit: HTMLElement | null = null;

  const mark = (s: Sentence | null) => {
    lit?.classList.remove('is-speaking');
    lit = null;
    if (canHighlight) CSS.highlights.delete('voz');
    if (!s) return;
    const range = canHighlight ? rangeFor(s) : null;
    if (range) CSS.highlights.set('voz', new Highlight(range));
    else { s.block.classList.add('is-speaking'); lit = s.block; }
    const r = s.block.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) s.block.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
  };

  const render = () => {
    play.textContent = mode === 'playing' ? 'Pausa' : mode === 'paused' ? 'Continuar' : 'Reproducir';
    play.setAttribute('aria-pressed', String(mode === 'playing'));
    status.textContent = mode === 'idle' ? '' : `${mode === 'playing' ? 'Leyendo' : 'En pausa'} · ${voice.name}`;
  };

  const speak = (i: number) => {
    const s = sentences[i];
    if (!s) { reset(); return; }
    index = i;
    const u = new SpeechSynthesisUtterance(s.text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = Number(rate.value) || 1;
    u.onstart = () => mark(s);
    u.onend = () => { if (mode === 'playing' && index === i) speak(i + 1); };
    speechSynthesis.speak(u);
  };

  const reset = () => {
    mode = 'idle';
    index = 0;
    speechSynthesis.cancel();
    mark(null);
    render();
  };

  play.addEventListener('click', () => {
    if (mode === 'playing') { mode = 'paused'; speechSynthesis.pause(); }
    else if (mode === 'paused') { mode = 'playing'; speechSynthesis.resume(); }
    else { mode = 'playing'; speechSynthesis.cancel(); speak(index); }
    render();
  });
  stop.addEventListener('click', reset);
  rate.addEventListener('change', () => {
    if (mode !== 'playing') return;
    // Restart the current sentence at the new speed.
    const i = index;
    index = -1;
    speechSynthesis.cancel();
    speak(i);
  });
  addEventListener('pagehide', () => speechSynthesis.cancel());

  section.hidden = false;
  render();
}
